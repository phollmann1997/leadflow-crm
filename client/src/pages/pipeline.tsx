import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Link } from "wouter";
import { PIPELINE_LABELS, KANBAN_DOT_COLORS, OBOR_LABELS } from "@shared/schema";
import type { Firma } from "@shared/schema";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

const STAGES = ["novy", "osloven", "odpovezel", "schuzka", "nabidka", "vyjednavani", "zakaznik", "nezajem"];

export default function PipelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: firmy = [], isLoading } = useQuery<Firma[]>({ queryKey: ["/api/firmy", `?userId=${user?.id}`] });

  const updateMutation = useMutation({
    mutationFn: async ({ id, stav }: { id: string; stav: string }) => {
      const r = await apiRequest("PATCH", `/api/firmy/${id}`, { stav });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firmy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const id = result.draggableId;
    const newStav = result.destination.droppableId;
    const firma = firmy.find(f => f.id === id);
    if (firma && firma.stav !== newStav) {
      updateMutation.mutate({ id, stav: newStav });
      toast({ title: `Presunuto do "${PIPELINE_LABELS[newStav]}"` });
    }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-32 mb-4" /><div className="flex gap-4 overflow-x-auto">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-96 w-64 shrink-0" />)}</div></div>;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Přetahuj firmy mezi stavy</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {STAGES.map(stav => {
            const stavFirmy = firmy.filter(f => f.stav === stav);
            const total = stavFirmy.reduce((s, f) => s + (f.hodnotaDealu ?? 0), 0);
            return (
              <div key={stav} className="w-60 shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${KANBAN_DOT_COLORS[stav]}`} />
                  <span className="text-sm font-medium">{PIPELINE_LABELS[stav]}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{stavFirmy.length}</span>
                </div>
                {total > 0 && <p className="text-xs text-muted-foreground mb-2 px-1">{formatCurrency(total)}</p>}
                <Droppable droppableId={stav}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 rounded-md p-2 space-y-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/30" : "bg-muted/30"}`}>
                      {stavFirmy.map((f, i) => (
                        <Draggable key={f.id} draggableId={f.id} index={i}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <Link href={`/firmy/${f.id}`}>
                                <Card className={`cursor-pointer ${snap.isDragging ? "shadow-lg rotate-1" : ""}`}>
                                  <CardContent className="p-3 space-y-1.5">
                                    <p className="text-sm font-medium truncate">{f.nazev}</p>
                                    <p className="text-xs text-muted-foreground truncate">{OBOR_LABELS[f.obor] ?? f.obor}{f.adresa ? ` · ${f.adresa}` : ""}</p>
                                    {f.hodnotaDealu ? <p className="text-xs font-medium">{formatCurrency(f.hodnotaDealu)}/mes.</p> : null}
                                    {f.tagy && <div className="flex gap-1 flex-wrap">{f.tagy.split(",").slice(0, 2).map(t => <span key={t.trim()} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.trim()}</span>)}</div>}
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
