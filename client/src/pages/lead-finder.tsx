import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Building2, MapPin, ExternalLink, Check, Globe } from "lucide-react";
import type { Firma } from "@shared/schema";

const KRAJE = [
  { kod: 0, nazev: "Všechny kraje" },
  { kod: 19, nazev: "Praha" },
  { kod: 35, nazev: "Jihočeský" },
  { kod: 31, nazev: "Jihomoravský" },
  { kod: 51, nazev: "Karlovarský" },
  { kod: 52, nazev: "Královéhradecký" },
  { kod: 41, nazev: "Liberecký" },
  { kod: 71, nazev: "Moravskoslezský" },
  { kod: 72, nazev: "Olomoucký" },
  { kod: 53, nazev: "Pardubický" },
  { kod: 32, nazev: "Plzeňský" },
  { kod: 27, nazev: "Středočeský" },
  { kod: 43, nazev: "Ústecký" },
  { kod: 64, nazev: "Vysočina" },
  { kod: 73, nazev: "Zlínský" },
];

interface AresSubjekt {
  ico?: string;
  obchodniJmeno: string;
  sidlo?: {
    nazevObce?: string;
    nazevKraje?: string;
    textovaAdresa?: string;
    kodKraje?: number;
  };
  czNace2008?: string[];
  pravniForma?: string;
  datumVzniku?: string;
  seznamRegistraci?: {
    stavZdrojeVr?: string;
    stavZdrojeRos?: string;
  };
}

interface AresResult {
  pocetCelkem: number;
  ekonomickeSubjekty: AresSubjekt[];
}

function getPravniFormaLabel(kod: string) {
  const map: Record<string, string> = {
    "101": "Fyzická osoba",
    "112": "s.r.o.",
    "121": "a.s.",
    "141": "o.p.s.",
    "205": "Družstvo",
    "301": "Státní podnik",
    "331": "Příspěvková org.",
    "701": "Sdružení",
    "706": "Spolek",
  };
  return map[kod] ?? kod;
}

export default function LeadFinderPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchName, setSearchName] = useState("");
  const [searchIco, setSearchIco] = useState("");
  const [kraj, setKraj] = useState("0");
  const [results, setResults] = useState<AresResult | null>(null);
  const [addedIcos, setAddedIcos] = useState<Set<string>>(new Set());

  // Get existing firmy to check for duplicates
  const { data: existingFirmy } = useQuery<Firma[]>({
    queryKey: ["/api/firmy", `?userId=${user?.id}`],
  });
  const existingIcos = new Set((existingFirmy ?? []).map((f) => f.ico).filter(Boolean));

  const searchMutation = useMutation({
    mutationFn: async () => {
      const body: any = { start: 0, pocet: 50 };
      if (searchName.trim()) body.obchodniJmeno = searchName.trim();
      if (searchIco.trim()) body.ico = searchIco.trim();
      const krajNum = parseInt(kraj);
      if (krajNum > 0) body.sidlo = { kodKraje: krajNum };

      if (!body.obchodniJmeno && !body.ico) {
        throw new Error("Zadej název firmy nebo IČO");
      }

      const res = await apiRequest("POST", "/api/ares/vyhledat", body);
      return (await res.json()) as AresResult;
    },
    onSuccess: (data) => setResults(data),
    onError: (err: any) =>
      toast({ title: "Chyba", description: err.message, variant: "destructive" }),
  });

  const addToFirmy = useMutation({
    mutationFn: async (subj: AresSubjekt) => {
      const body = {
        userId: user?.id,
        nazev: subj.obchodniJmeno,
        ico: subj.ico || "",
        adresa: subj.sidlo?.nazevObce || "",
        obor: "jine",
        zdroj: "ares",
        stav: "novy",
        hodnotaDealu: 0,
        poznamky: `Nalezeno přes ARES. Adresa: ${subj.sidlo?.textovaAdresa || "N/A"}. Právní forma: ${getPravniFormaLabel(subj.pravniForma || "")}. Vznik: ${subj.datumVzniku || "N/A"}.`,
      };
      await apiRequest("POST", "/api/firmy", body);
    },
    onSuccess: (_, subj) => {
      setAddedIcos((prev) => new Set([...prev, subj.ico || ""]));
      queryClient.invalidateQueries({ queryKey: ["/api/firmy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Přidáno", description: `${subj.obchodniJmeno} přidána do CRM` });
    },
    onError: () =>
      toast({ title: "Chyba", description: "Nepodařilo se přidat firmu", variant: "destructive" }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMutation.mutate();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-lead-finder-title">
          Hledat leady
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vyhledávej firmy v ARES a přidávej je do CRM jedním klikem
        </p>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Název firmy</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-ares-name"
                    placeholder="faktoring, účetní, spedice..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">IČO</label>
                <Input
                  data-testid="input-ares-ico"
                  placeholder="12345678"
                  value={searchIco}
                  onChange={(e) => setSearchIco(e.target.value)}
                  maxLength={8}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-64">
                <label className="text-sm font-medium mb-1.5 block">Kraj</label>
                <Select value={kraj} onValueChange={setKraj}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KRAJE.map((k) => (
                      <SelectItem key={k.kod} value={String(k.kod)}>
                        {k.nazev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={searchMutation.isPending}
                data-testid="button-ares-search"
              >
                <Search className="h-4 w-4 mr-2" />
                {searchMutation.isPending ? "Hledám..." : "Hledat v ARES"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Suggested searches */}
      {!results && !searchMutation.isPending && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Rychlé hledání:</span>
          {["faktoring", "účetní", "spedice", "inkaso", "makléř"].map((term) => (
            <Button
              key={term}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchName(term);
                setSearchIco("");
                setTimeout(() => searchMutation.mutate(), 0);
              }}
              data-testid={`button-quick-search-${term}`}
            >
              {term}
            </Button>
          ))}
        </div>
      )}

      {/* Loading */}
      {searchMutation.isPending && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      )}

      {/* Results */}
      {results && !searchMutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Nalezeno <strong>{results.pocetCelkem}</strong> firem
              {results.pocetCelkem > 50 && " (zobrazeno prvních 50)"}
            </p>
          </div>

          {results.ekonomickeSubjekty.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Žádné firmy nenalezeny. Zkus upravit hledání.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {results.ekonomickeSubjekty.map((subj, idx) => {
                const ico = subj.ico || "";
                const alreadyInCRM = existingIcos.has(ico);
                const justAdded = addedIcos.has(ico);
                const isAdded = alreadyInCRM || justAdded;

                return (
                  <Card
                    key={`${ico}-${idx}`}
                    className={isAdded ? "opacity-60" : ""}
                    data-testid={`ares-result-${idx}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">
                              {subj.obchodniJmeno}
                            </h3>
                            {subj.pravniForma && (
                              <Badge variant="secondary" className="text-xs">
                                {getPravniFormaLabel(subj.pravniForma)}
                              </Badge>
                            )}
                            {isAdded && (
                              <Badge
                                variant="outline"
                                className="text-xs text-green-600 border-green-300"
                              >
                                <Check className="h-3 w-3 mr-1" /> V CRM
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            {ico && <span>IČ: {ico}</span>}
                            {subj.sidlo?.nazevObce && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {subj.sidlo.nazevObce}
                                {subj.sidlo.nazevKraje && `, ${subj.sidlo.nazevKraje}`}
                              </span>
                            )}
                            {subj.datumVzniku && (
                              <span>
                                Vznik:{" "}
                                {new Date(subj.datumVzniku).toLocaleDateString("cs-CZ")}
                              </span>
                            )}
                          </div>
                          {subj.sidlo?.textovaAdresa && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {subj.sidlo.textovaAdresa}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ico && (
                            <a
                              href={`https://ares.gov.cz/ekonomicke-subjekty?ico=${ico}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          )}
                          <Button
                            size="sm"
                            disabled={isAdded || addToFirmy.isPending}
                            onClick={() => addToFirmy.mutate(subj)}
                            data-testid={`button-add-ares-${idx}`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" /> Přidáno
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-1" /> Přidat do CRM
                              </>
                            )}
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
      )}
    </div>
  );
}
