import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PIPELINE_LABELS, PIPELINE_COLORS, PRIORITA_COLORS, FOLLOWUP_TYPY } from "@shared/schema";
import { Users, TrendingUp, Trophy, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Firma } from "@shared/schema";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" });
}

function isOverdue(d: string | Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(d) < today;
}

function isToday(d: string | Date) {
  const today = new Date();
  const date = new Date(d);
  return today.toDateString() === date.toDateString();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/stats", `?userId=${user?.id}`],
  });

  const toggleFollowup = useMutation({
    mutationFn: async ({ id, splneno }: { id: string; splneno: boolean }) => {
      await apiRequest("PATCH", `/api/followupy/${id}`, {
        splneno,
        splnenoDate: splneno ? new Date() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}
        </div>
        <Skeleton className="h-64 rounded-md" />
      </div>
    );
  }

  const allFollowups = [
    ...(stats?.followupyProsle ?? []).map((f: any) => ({ ...f, _type: "prosly" })),
    ...(stats?.followupyDnes ?? []).map((f: any) => ({ ...f, _type: "dnes" })),
    ...(stats?.followupyBlizici ?? [])
      .filter((f: any) => !isToday(f.datumPlan))
      .map((f: any) => ({ ...f, _type: "blizici" })),
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full" data-testid="page-dashboard">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Přehled</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="kpi-aktivni-leady">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Aktivní projekty</p>
                <p className="text-2xl font-semibold">{stats?.aktivniLeady ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-hodnota-pipeline">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Hodnota pipeline</p>
                <p className="text-2xl font-semibold">{formatCurrency(stats?.celkovaHodnota ?? 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-md bg-chart-4/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-zakazniku">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Zákazníků</p>
                <p className="text-2xl font-semibold">{stats?.zakazniku ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-prosle-fu">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Prošlé follow-upy</p>
                <p className={`text-2xl font-semibold ${(stats?.prosleFU ?? 0) > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {stats?.prosleFU ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-upy */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Follow-upy k vyřízení</CardTitle>
          <Link href="/followupy">
            <Button variant="ghost" size="sm" data-testid="button-all-followups">
              Vše <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {allFollowups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Žádné follow-upy k vyřízení</p>
          ) : (
            <div className="space-y-2">
              {allFollowups.map((fu: any) => {
                const overdue = isOverdue(fu.datumPlan) && !fu.splneno;
                const today = isToday(fu.datumPlan);
                return (
                  <div
                    key={fu.id}
                    className={`flex items-center gap-3 p-3 rounded-md border ${
                      overdue ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" :
                      today ? "border-yellow-300 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20" :
                      "border-border/50"
                    }`}
                    data-testid={`followup-${fu.id}`}
                  >
                    <Checkbox
                      checked={fu.splneno}
                      onCheckedChange={(checked) =>
                        toggleFollowup.mutate({ id: fu.id, splneno: checked as boolean })
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fu.popis}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITA_COLORS[fu.priorita]}`}>
                          {fu.priorita === "vysoka" ? "Vysoká" : fu.priorita === "stredni" ? "Střední" : "Nízká"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {FOLLOWUP_TYPY.find(t => t.value === fu.typ)?.label ?? fu.typ}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${overdue ? "text-red-600 dark:text-red-400" : today ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`}>
                        {overdue ? "Po termínu" : today ? "Dnes" : formatDate(fu.datumPlan)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline overview + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pipeline (projekty)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.stavDistribuce && Object.entries(stats.stavDistribuce).map(([stav, count]) => (
              <div key={stav} className="flex items-center justify-between gap-2 text-sm" data-testid={`pipeline-stat-${stav}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PIPELINE_COLORS[stav]}`}>
                    {PIPELINE_LABELS[stav] ?? stav}
                  </span>
                </div>
                <span className="text-muted-foreground font-medium">{count as number}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Poslední firmy</CardTitle>
            <Link href="/firmy">
              <Button variant="ghost" size="sm" data-testid="button-all-firmy">
                Vše <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.nedavneFiremy?.map((f: Firma) => (
              <Link key={f.id} href={`/firmy/${f.id}`}>
                <div className="flex items-center justify-between gap-2 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`recent-firma-${f.id}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.nazev}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.adresa}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
