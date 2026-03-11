import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2 } from "lucide-react";
import { Link } from "wouter";
import FirmaForm from "@/components/FirmaForm";
import { PIPELINE_LABELS, PIPELINE_COLORS, OBOR_LABELS } from "@shared/schema";
import type { Firma } from "@shared/schema";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

export default function FirmyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [stavFilter, setStavFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
  const { data: firmy = [], isLoading } = useQuery<Firma[]>({
    queryKey: ["/api/firmy", `?userId=${user?.id}${searchParam}`],
  });

  const filtered = stavFilter === "all" ? firmy : firmy.filter(f => f.stav === stavFilter);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/firmy", { ...data, userId: user?.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firmy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDialogOpen(false);
      toast({ title: "Firma vytvorena" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/firmy/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firmy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Firma smazana" });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-auto h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Firmy</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} firem celkem</p>
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
        <Select value={stavFilter} onValueChange={setStavFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtr stavu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vsechny stavy</SelectItem>
            {Object.entries(PIPELINE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Žádné firmy nenalezeny</p>
          <p className="text-sm mt-1">Přidej první firmu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
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
                          {f.ico && ` · IC ${f.ico}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    {f.hodnotaDealu ? <span className="text-sm font-medium">{formatCurrency(f.hodnotaDealu)}</span> : null}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PIPELINE_COLORS[f.stav]}`}>
                      {PIPELINE_LABELS[f.stav]}
                    </span>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); deleteMutation.mutate(f.id); }}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
