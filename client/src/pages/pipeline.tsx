import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Link } from "wouter";
import { PIPELINE_LABELS, KANBAN_DOT_COLORS } from "@shared/schema";
import type { Projekt, Firma } from "@shared/schema";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

const STAGES = ["novy", "osloven", "odpovezel", "schuzka", "nabidka", "vyjednavani", "zakaznik", "nezajem"];

export default function PipelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: projekty = [], isLoading } = useQuery<Projekt[]>({ queryKey: ["/api/projekty", `?userId=${user?.id}`] });
  const { data: firmy = [] } = useQuery<Firma[]>({ queryKey: ["/api/firmy", `?userId=${user?.id}`] });

  const getFirmaName = (firmaId: string) => firmy.find(f => f.id === firmaId)?.nazev ?? "";

  const updateMutation = useMutation({
    mutationFn: async ({ id, stav }: { id: string; stav: string }) => {
      const r = await apiRequest("PATCH", `/api/projekty/${id}`, { stav });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projekty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const id = result.draggableId;
    const newStav = result.destination.droppableId;
    const projekt = projekty.find(p => p.id === id);
    if (projekt && projekt.stav !== newStav) {
      updateMutation.mutate({ id, stav: newStav });
      toast({ title: `Přesunuto do "${PIPELINE_LABELS[newStav]}"` });
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-32 mb-4" /><div className="flex gap-4 overflow-x-auto">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-96 w-64 shrink-0" />)}</div></div>;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col" data-testid="page-pipeline">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Přetahuj projekty mezi stavy</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {STAGES.map(stav => {
            const stavProjekty = projekty.filter(p => p.stav === stav);
            const total = stavProjekty.reduce((s, p) => s + (p.hodnotaDealu ?? 0), 0);
            return (
              <div key={stav} className="w-60 shrink-0 flex flex-col" data-testid={`pipeline-column-${stav}`}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${KANBAN_DOT_COLORS[stav]}`} />
                  <span className="text-sm font-medium">{PIPELINE_LABELS[stav]}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{stavProjekty.length}</span>
                </div>
                {total > 0 && <p className="text-xs text-muted-foreground mb-2 px-1">{formatCurrency(total)}</p>}
                <Droppable droppableId={stav}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 rounded-md p-2 space-y-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/30" : "bg-muted/30"}`}>
                      {stavProjekty.map((p, i) => (
                        <Draggable key={p.id} draggableId={p.id} index={i}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <Link href={`/firmy/${p.firmaId}`}>
                                <Card className={`cursor-pointer ${snap.isDragging ? "shadow-lg rotate-1" : ""}`} data-testid={`pipeline-card-${p.id}`}>
                                  <CardContent className="p-3 space-y-1.5">
                                    <p className="text-sm font-medium truncate">{p.nazev}</p>
                                    <p className="text-xs text-muted-foreground truncate">{getFirmaName(p.firmaId)}</p>
                                    {p.hodnotaDealu ? <p className="text-xs font-medium">{formatCurrency(p.hodnotaDealu)}/měs.</p> : null}
                                  </CardContent>
                                </Card>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
