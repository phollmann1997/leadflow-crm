import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, FolderOpen } from "lucide-react";
import { Link } from "wouter";
import FirmaForm from "@/components/FirmaForm";
import { OBOR_LABELS } from "@shared/schema";
import type { Firma, Projekt } from "@shared/schema";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

export default function FirmyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
  const { data: firmy = [], isLoading } = useQuery<Firma[]>({
    queryKey: ["/api/firmy", `?userId=${user?.id}${searchParam}`],
  });
  const { data: projekty = [] } = useQuery<Projekt[]>({
    queryKey: ["/api/projekty", `?userId=${user?.id}`],
  });

  const getProjektyCount = (firmaId: string) => projekty.filter(p => p.firmaId === firmaId).length;
  const getCombinedValue = (firmaId: string) => projekty.filter(p => p.firmaId === firmaId).reduce((s, p) => s + (p.hodnotaDealu ?? 0), 0);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/firmy", { ...data, userId: user?.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firmy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDialogOpen(false);
      toast({ title: "Firma vytvořena" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/firmy/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firmy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projekty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Firma smazána" });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-auto h-full" data-testid="page-firmy">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Firmy</h1>
          <p className="text-sm text-muted-foreground">{firmy.length} firem celkem</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-firma">
              <Plus className="h-4 w-4 mr-2" /> Přidat firmu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nová firma</DialogTitle></DialogHeader>
            <FirmaForm onSubmit={(data) => createMutation.mutate(data)} isPending={createMutation.isPending} submitLabel="Vytvořit" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input data-testid="input-search" placeholder="Hledat firmu, IČO, obor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}</div>
      ) : firmy.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Žádné firmy nenalezeny</p>
          <p className="text-sm mt-1">Přidej první firmu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {firmy.map((f) => {
            const projektCount = getProjektyCount(f.id);
            const totalValue = getCombinedValue(f.id);
            return (
              <Card key={f.id} className="hover-elevate cursor-pointer" data-testid={`card-firma-${f.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Link href={`/firmy/${f.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{f.nazev.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{f.nazev}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {OBOR_LABELS[f.obor] ?? f.obor}
                            {f.adresa && ` · ${f.adresa}`}
                            {f.ico && ` · IČ ${f.ico}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{projektCount} {projektCount === 1 ? "projekt" : projektCount >= 2 && projektCount <= 4 ? "projekty" : "projektů"}</span>
                      </div>
                      {totalValue > 0 && <span className="text-sm font-medium">{formatCurrency(totalValue)}</span>}
                      <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); deleteMutation.mutate(f.id); }} data-testid={`button-delete-firma-${f.id}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
