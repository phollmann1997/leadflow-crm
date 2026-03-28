import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Link } from "wouter";
import { FOLLOWUP_TYPY, PRIORITA_OPTIONS, PRIORITA_COLORS } from "@shared/schema";
import type { Followup, Firma, Projekt } from "@shared/schema";

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(d: string | Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(d) < today;
}

export default function FollowupyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: followupy = [], isLoading } = useQuery<Followup[]>({ queryKey: ["/api/followupy", `?userId=${user?.id}`] });
  const { data: firmy = [] } = useQuery<Firma[]>({ queryKey: ["/api/firmy", `?userId=${user?.id}`] });
  const { data: projekty = [] } = useQuery<Projekt[]>({ queryKey: ["/api/projekty", `?userId=${user?.id}`] });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, splneno }: { id: string; splneno: boolean }) => {
      await apiRequest("PATCH", `/api/followupy/${id}`, { splneno, splnenoDate: splneno ? new Date() : null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/followupy/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const nesplnene = followupy.filter(f => !f.splneno);
  const splnene = followupy.filter(f => f.splneno);
  const getFirmaName = (fId: string) => firmy.find(f => f.id === fId)?.nazev ?? "";
  const getProjektName = (pId: string | null) => {
    if (!pId) return null;
    return projekty.find(p => p.id === pId)?.nazev ?? null;
  };

  const renderList = (items: Followup[]) => (
    items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Žádné follow-upy</p> :
    <div className="space-y-2">
      {items.map(fu => {
        const overdue = !fu.splneno && isOverdue(fu.datumPlan);
        const firmaName = getFirmaName(fu.firmaId);
        const projektName = getProjektName(fu.projektId);
        return (
          <div key={fu.id} className={`flex items-center gap-3 p-3 rounded-md border ${overdue ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" : "border-border/50"} ${fu.splneno ? "opacity-50" : ""}`} data-testid={`followup-${fu.id}`}>
            <Checkbox checked={fu.splneno ?? false} onCheckedChange={(c) => toggleMutation.mutate({ id: fu.id, splneno: c as boolean })} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${fu.splneno ? "line-through text-muted-foreground" : "font-medium"}`}>{fu.popis}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {firmaName && (
                  <Link href={`/firmy/${fu.firmaId}`}>
                    <span className="text-xs text-primary cursor-pointer">{firmaName}</span>
                  </Link>
                )}
                {projektName && <span className="text-xs text-muted-foreground">· {projektName}</span>}
                <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITA_COLORS[fu.priorita]}`}>{PRIORITA_OPTIONS.find(p => p.value === fu.priorita)?.label}</span>
                <span className="text-xs text-muted-foreground">{FOLLOWUP_TYPY.find(t => t.value === fu.typ)?.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-xs ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>{overdue ? "Po termínu!" : formatDate(fu.datumPlan)}</span>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(fu.id)} data-testid={`button-delete-fu-${fu.id}`}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isLoading) return <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>;

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-auto h-full" data-testid="page-followupy">
      <div>
        <h1 className="text-2xl font-semibold">Follow-upy</h1>
        <p className="text-sm text-muted-foreground">{nesplnene.length} k vyřízení, {splnene.length} splněných</p>
      </div>

      <Tabs defaultValue="aktivni">
        <TabsList>
          <TabsTrigger value="aktivni" data-testid="tab-aktivni">K vyřízení ({nesplnene.length})</TabsTrigger>
          <TabsTrigger value="splnene" data-testid="tab-splnene">Splněné ({splnene.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="aktivni" className="mt-4">{renderList(nesplnene)}</TabsContent>
        <TabsContent value="splnene" className="mt-4">{renderList(splnene)}</TabsContent>
      </Tabs>
    </div>
  );
}
