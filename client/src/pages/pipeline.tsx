import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Link } from "wouter";
import type { Lead } from "@shared/schema";

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", label: "Qualified", color: "bg-purple-500" },
  { id: "proposal", label: "Proposal", color: "bg-indigo-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
}

export default function PipelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", `?userId=${user?.id}`],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}`, { stage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.stage !== newStage) {
      updateMutation.mutate({ id: leadId, stage: newStage });
      toast({
        title: `Moved to ${PIPELINE_STAGES.find(s => s.id === newStage)?.label}`,
      });
    }
  };

  const getLeadsByStage = (stage: string) =>
    leads.filter(l => l.stage === stage);

  const getStageValue = (stage: string) =>
    getLeadsByStage(stage).reduce((sum, l) => sum + (l.value ?? 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold" data-testid="text-pipeline-title">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag leads between stages</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            const stageValue = getStageValue(stage.id);
            return (
              <div key={stage.id} className="w-64 shrink-0 flex flex-col" data-testid={`column-${stage.id}`}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-medium">{stage.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{stageLeads.length}</span>
                </div>
                {stageValue > 0 && (
                  <p className="text-xs text-muted-foreground mb-2 px-1">{formatCurrency(stageValue)}</p>
                )}

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-md p-2 space-y-2 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-primary/5 border-2 border-dashed border-primary/30"
                          : "bg-muted/30"
                      }`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Link href={`/leads/${lead.id}`}>
                                <Card
                                  className={`cursor-pointer ${snapshot.isDragging ? "shadow-lg rotate-1" : ""}`}
                                  data-testid={`pipeline-card-${lead.id}`}
                                >
                                  <CardContent className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-medium text-primary">
                                          {lead.firstName[0]}{lead.lastName[0]}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {lead.firstName} {lead.lastName}
                                        </p>
                                      </div>
                                    </div>
                                    {lead.company && (
                                      <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                                    )}
                                    {lead.value ? (
                                      <p className="text-xs font-medium">{formatCurrency(lead.value)}</p>
                                    ) : null}
                                    {lead.tags && (
                                      <div className="flex gap-1 flex-wrap">
                                        {lead.tags.split(",").slice(0, 2).map((tag) => (
                                          <span key={tag.trim()} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                            {tag.trim()}
                                          </span>
                                        ))}
                                      </div>
                                    )}
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
