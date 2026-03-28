import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Mail, Phone, Globe, MapPin, Building2, ExternalLink, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { Link, useRoute } from "wouter";
import FirmaForm from "@/components/FirmaForm";
import ProjektForm from "@/components/ProjektForm";
import { PIPELINE_LABELS, PIPELINE_COLORS, OBOR_LABELS, ZDROJ_LABELS, KOMUNIKACE_TYPY, SMER_OPTIONS, FOLLOWUP_TYPY, PRIORITA_OPTIONS, PRIORITA_COLORS } from "@shared/schema";
import type { Firma, Kontakt, Komunikace, Followup, Projekt } from "@shared/schema";

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}
function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

function ProjektCard({ projekt, firmaId }: { projekt: Projekt; firmaId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [komOpen, setKomOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);

  // Komunikace form state
  const [komTyp, setKomTyp] = useState("email");
  const [komSmer, setKomSmer] = useState("odchozi");
  const [komPredmet, setKomPredmet] = useState("");
  const [komObsah, setKomObsah] = useState("");
  const [komOdpoved, setKomOdpoved] = useState("");

  // Followup form state
  const [fuTyp, setFuTyp] = useState("email");
  const [fuPopis, setFuPopis] = useState("");
  const [fuDatum, setFuDatum] = useState("");
  const [fuPriorita, setFuPriorita] = useState("stredni");

  const { data: followupy = [] } = useQuery<Followup[]>({
    queryKey: ["/api/followupy", `?projektId=${projekt.id}`],
    enabled: expanded,
  });

  const { data: komunikace = [] } = useQuery<Komunikace[]>({
    queryKey: ["/api/komunikace", `?firmaId=${firmaId}&projektId=${projekt.id}`],
    enabled: expanded,
  });

  const updateProjekt = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("PATCH", `/api/projekty/${projekt.id}`, data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projekty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditOpen(false);
      toast({ title: "Projekt upraven" });
    },
  });

  const deleteProjekt = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/projekty/${projekt.id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projekty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Projekt smazán" });
    },
  });

  const addKomunikace = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/komunikace", {
        firmaId, projektId: projekt.id, userId: user?.id,
        typ: komTyp, smer: komSmer, predmet: komPredmet, obsah: komObsah, odpoved: komOdpoved || null,
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/komunikace"] });
      setKomOpen(false);
      setKomPredmet(""); setKomObsah(""); setKomOdpoved("");
      toast({ title: "Záznam přidán" });
    },
  });

  const deleteKomunikace = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/komunikace/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/komunikace"] }); },
  });

  const addFollowup = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/followupy", {
        firmaId, projektId: projekt.id, userId: user?.id,
        typ: fuTyp, popis: fuPopis, datumPlan: new Date(fuDatum), priorita: fuPriorita,
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setFuOpen(false);
      setFuPopis(""); setFuDatum("");
      toast({ title: "Follow-up vytvořen" });
    },
  });

  const toggleFollowup = useMutation({
    mutationFn: async ({ id, splneno }: { id: string; splneno: boolean }) => {
      await apiRequest("PATCH", `/api/followupy/${id}`, { splneno, splnenoDate: splneno ? new Date() : null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const deleteFollowup = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/followupy/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const activeFollowups = followupy.filter(f => !f.splneno).length;

  return (
    <Card data-testid={`card-projekt-${projekt.id}`}>
      <CardContent className="p-0">
        {/* Project header - always visible */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
          data-testid={`projekt-toggle-${projekt.id}`}
        >
          {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{projekt.nazev}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${PIPELINE_COLORS[projekt.stav]}`}>{PIPELINE_LABELS[projekt.stav]}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {projekt.hodnotaDealu ? <span>{formatCurrency(projekt.hodnotaDealu)}/měs.</span> : null}
              {activeFollowups > 0 && expanded && <span>{activeFollowups} follow-up(ů)</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-edit-projekt-${projekt.id}`}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Upravit projekt</DialogTitle></DialogHeader>
                <ProjektForm defaultValues={projekt} onSubmit={(d) => updateProjekt.mutate(d)} isPending={updateProjekt.isPending} submitLabel="Uložit změny" />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => deleteProjekt.mutate()} data-testid={`button-delete-projekt-${projekt.id}`}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            {projekt.popis && <p className="text-sm text-muted-foreground">{projekt.popis}</p>}

            {/* Follow-upy */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Follow-upy</p>
                <Dialog open={fuOpen} onOpenChange={setFuOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="secondary" data-testid={`button-add-followup-${projekt.id}`}><Plus className="h-3.5 w-3.5 mr-1" />Přidat</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nový follow-up</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div><label className="text-sm font-medium mb-1 block">Typ</label>
                        <Select value={fuTyp} onValueChange={setFuTyp}><SelectTrigger data-testid="select-fu-typ"><SelectValue /></SelectTrigger><SelectContent>
                          {FOLLOWUP_TYPY.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent></Select></div>
                      <div><label className="text-sm font-medium mb-1 block">Co udělat *</label><Input data-testid="input-fu-popis" value={fuPopis} onChange={e => setFuPopis(e.target.value)} placeholder="Zavolat, poslat email..." /></div>
                      <div><label className="text-sm font-medium mb-1 block">Kdy *</label><Input data-testid="input-fu-datum" type="date" value={fuDatum} onChange={e => setFuDatum(e.target.value)} /></div>
                      <div><label className="text-sm font-medium mb-1 block">Priorita</label>
                        <Select value={fuPriorita} onValueChange={setFuPriorita}><SelectTrigger data-testid="select-fu-priorita"><SelectValue /></SelectTrigger><SelectContent>
                          {PRIORITA_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent></Select></div>
                      <Button className="w-full" disabled={!fuPopis || !fuDatum} onClick={() => addFollowup.mutate()} data-testid="button-fu-submit">Vytvořit</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {followupy.length === 0 ? (
                <p className="text-xs text-muted-foreground">Žádné follow-upy</p>
              ) : (
                <div className="space-y-1.5">
                  {followupy.map(fu => {
                    const overdue = !fu.splneno && new Date(fu.datumPlan) < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <div key={fu.id} className={`flex items-center gap-2 p-2 rounded-md border text-sm ${overdue ? "border-red-300 dark:border-red-800" : "border-border/50"} ${fu.splneno ? "opacity-50" : ""}`} data-testid={`followup-${fu.id}`}>
                        <Checkbox checked={fu.splneno ?? false} onCheckedChange={(c) => toggleFollowup.mutate({ id: fu.id, splneno: c as boolean })} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${fu.splneno ? "line-through text-muted-foreground" : "font-medium"}`}>{fu.popis}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] px-1 py-0.5 rounded ${PRIORITA_COLORS[fu.priorita]}`}>{PRIORITA_OPTIONS.find(p => p.value === fu.priorita)?.label}</span>
                            <span className="text-[10px] text-muted-foreground">{FOLLOWUP_TYPY.find(t => t.value === fu.typ)?.label}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] shrink-0 ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>{formatDate(fu.datumPlan)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteFollowup.mutate(fu.id)} data-testid={`button-delete-fu-${fu.id}`}><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Komunikace */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Komunikace</p>
                <Dialog open={komOpen} onOpenChange={setKomOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="secondary" data-testid={`button-add-komunikace-${projekt.id}`}><Plus className="h-3.5 w-3.5 mr-1" />Přidat</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nový záznam komunikace</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-sm font-medium mb-1 block">Kanál</label>
                          <Select value={komTyp} onValueChange={setKomTyp}><SelectTrigger data-testid="select-kom-typ"><SelectValue /></SelectTrigger><SelectContent>
                            {KOMUNIKACE_TYPY.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent></Select></div>
                        <div><label className="text-sm font-medium mb-1 block">Směr</label>
                          <Select value={komSmer} onValueChange={setKomSmer}><SelectTrigger data-testid="select-kom-smer"><SelectValue /></SelectTrigger><SelectContent>
                            {SMER_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent></Select></div>
                      </div>
                      <div><label className="text-sm font-medium mb-1 block">Předmět *</label><Input data-testid="input-kom-predmet" value={komPredmet} onChange={e => setKomPredmet(e.target.value)} placeholder="O čem to bylo..." /></div>
                      <div><label className="text-sm font-medium mb-1 block">Obsah</label><Textarea data-testid="input-kom-obsah" value={komObsah} onChange={e => setKomObsah(e.target.value)} rows={3} placeholder="Podrobnosti..." /></div>
                      <div><label className="text-sm font-medium mb-1 block">Jejich odpověď</label><Textarea data-testid="input-kom-odpoved" value={komOdpoved} onChange={e => setKomOdpoved(e.target.value)} rows={2} placeholder="Co říkali / napsali..." /></div>
                      <Button className="w-full" disabled={!komPredmet} onClick={() => addKomunikace.mutate()} data-testid="button-kom-submit">Uložit záznam</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {komunikace.length === 0 ? (
                <p className="text-xs text-muted-foreground">Žádná komunikace</p>
              ) : (
                <div className="space-y-2">
                  {komunikace.map(c => (
                    <div key={c.id} className="p-2 rounded-md border border-border/50 space-y-1" data-testid={`komunikace-${c.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{KOMUNIKACE_TYPY.find(t => t.value === c.typ)?.label ?? c.typ}</Badge>
                          <Badge variant={c.smer === "prichozi" ? "default" : "secondary"} className="text-[10px]">
                            {c.smer === "prichozi" ? "Příchozí" : "Odchozí"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(c.datum)}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteKomunikace.mutate(c.id)} data-testid={`button-delete-kom-${c.id}`}><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
                      </div>
                      <p className="text-xs font-medium">{c.predmet}</p>
                      {c.obsah && <p className="text-[10px] text-muted-foreground">{c.obsah}</p>}
                      {c.odpoved && <div className="p-1.5 rounded bg-muted/50"><p className="text-[10px] font-medium mb-0.5">Odpověď:</p><p className="text-[10px] text-muted-foreground">{c.odpoved}</p></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FirmaDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/firmy/:id");
  const firmaId = params?.id;
  const [editOpen, setEditOpen] = useState(false);
  const [kontaktOpen, setKontaktOpen] = useState(false);
  const [projektOpen, setProjektOpen] = useState(false);

  // Kontakt form state
  const [kJmeno, setKJmeno] = useState(""); const [kPrijmeni, setKPrijmeni] = useState("");
  const [kPozice, setKPozice] = useState(""); const [kEmail, setKEmail] = useState("");
  const [kTelefon, setKTelefon] = useState(""); const [kLinkedin, setKLinkedin] = useState("");
  const [kPoznamky, setKPoznamky] = useState("");

  const { data: firma, isLoading: firmaLoading } = useQuery<Firma>({ queryKey: ["/api/firmy", firmaId], enabled: !!firmaId });
  const { data: kontakty = [] } = useQuery<Kontakt[]>({ queryKey: ["/api/kontakty", `?firmaId=${firmaId}`], enabled: !!firmaId });
  const { data: projekty = [] } = useQuery<Projekt[]>({ queryKey: ["/api/projekty", `?firmaId=${firmaId}`], enabled: !!firmaId });

  const updateFirma = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("PATCH", `/api/firmy/${firmaId}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/firmy"] }); queryClient.invalidateQueries({ queryKey: ["/api/stats"] }); setEditOpen(false); toast({ title: "Firma upravena" }); },
  });

  const addKontakt = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/kontakty", { firmaId, jmeno: kJmeno, prijmeni: kPrijmeni, pozice: kPozice, email: kEmail, telefon: kTelefon, linkedin: kLinkedin, poznamky: kPoznamky, jePrimarni: kontakty.length === 0 });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kontakty"] }); setKontaktOpen(false);
      setKJmeno(""); setKPrijmeni(""); setKPozice(""); setKEmail(""); setKTelefon(""); setKLinkedin(""); setKPoznamky("");
      toast({ title: "Kontakt přidán" });
    },
  });

  const deleteKontakt = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/kontakty/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kontakty"] }); },
  });

  const addProjekt = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/projekty", { ...data, firmaId, userId: user?.id });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projekty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setProjektOpen(false);
      toast({ title: "Projekt vytvořen" });
    },
  });

  if (firmaLoading) return <div className="p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 mt-4" /></div>;
  if (!firma) return <div className="p-6"><p>Firma nenalezena</p><Link href="/firmy"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Zpět</Button></Link></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/firmy"><Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-firma-nazev">{firma.nazev}</h1>
            <p className="text-sm text-muted-foreground">{OBOR_LABELS[firma.obor] ?? firma.obor}{firma.adresa ? ` · ${firma.adresa}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild><Button variant="secondary" size="sm" data-testid="button-edit-firma"><Pencil className="h-3.5 w-3.5 mr-1.5" />Upravit</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Upravit firmu</DialogTitle></DialogHeader>
              <FirmaForm defaultValues={firma} onSubmit={(d) => updateFirma.mutate(d)} isPending={updateFirma.isPending} submitLabel="Uložit změny" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Info o firmě</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {firma.ico && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground shrink-0" /><span>IČ: {firma.ico}</span></div>}
              {firma.web && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground shrink-0" /><a href={firma.web} target="_blank" rel="noopener noreferrer" className="text-primary truncate">{firma.web}</a></div>}
              {firma.adresa && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" /><span>{firma.adresa}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Zdroj</span><span>{ZDROJ_LABELS[firma.zdroj] ?? firma.zdroj}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Zaměstnanců</span><span>{firma.pocetZamestnancu || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Přidáno</span><span>{formatDate(firma.createdAt)}</span></div>
              {firma.tagy && <div className="flex flex-wrap gap-1 pt-2">{firma.tagy.split(",").map(t => <Badge key={t.trim()} variant="secondary" className="text-xs">{t.trim()}</Badge>)}</div>}
            </CardContent>
          </Card>
          {firma.ppisPodnikani && <Card><CardHeader className="pb-3"><CardTitle className="text-base">Popis podnikání</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{firma.ppisPodnikani}</p></CardContent></Card>}
          {firma.poznamky && <Card><CardHeader className="pb-3"><CardTitle className="text-base">Poznámky</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{firma.poznamky}</p></CardContent></Card>}

          {/* Kontakty */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Kontaktní osoby</CardTitle>
              <Dialog open={kontaktOpen} onOpenChange={setKontaktOpen}>
                <DialogTrigger asChild><Button size="sm" variant="secondary" data-testid="button-add-kontakt"><Plus className="h-3.5 w-3.5 mr-1" />Přidat</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nový kontakt</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium mb-1 block">Jméno *</label><Input data-testid="input-k-jmeno" value={kJmeno} onChange={e => setKJmeno(e.target.value)} /></div>
                      <div><label className="text-sm font-medium mb-1 block">Příjmení *</label><Input data-testid="input-k-prijmeni" value={kPrijmeni} onChange={e => setKPrijmeni(e.target.value)} /></div>
                    </div>
                    <div><label className="text-sm font-medium mb-1 block">Pozice</label><Input data-testid="input-k-pozice" value={kPozice} onChange={e => setKPozice(e.target.value)} placeholder="CEO, jednatel..." /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium mb-1 block">Email</label><Input data-testid="input-k-email" value={kEmail} onChange={e => setKEmail(e.target.value)} /></div>
                      <div><label className="text-sm font-medium mb-1 block">Telefon</label><Input data-testid="input-k-telefon" value={kTelefon} onChange={e => setKTelefon(e.target.value)} /></div>
                    </div>
                    <div><label className="text-sm font-medium mb-1 block">LinkedIn</label><Input data-testid="input-k-linkedin" value={kLinkedin} onChange={e => setKLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                    <div><label className="text-sm font-medium mb-1 block">Poznámky</label><Textarea data-testid="input-k-poznamky" value={kPoznamky} onChange={e => setKPoznamky(e.target.value)} rows={2} /></div>
                    <Button className="w-full" disabled={!kJmeno || !kPrijmeni} onClick={() => addKontakt.mutate()} data-testid="button-kontakt-submit">Přidat kontakt</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {kontakty.length === 0 ? <p className="text-sm text-muted-foreground">Žádné kontakty</p> : (
                <div className="space-y-3">
                  {kontakty.map(k => (
                    <div key={k.id} className="p-3 rounded-md border border-border/50 space-y-1" data-testid={`kontakt-${k.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{k.jmeno} {k.prijmeni}{k.jePrimarni && <Badge variant="secondary" className="text-[10px] ml-2">Hlavní</Badge>}</p>
                        <Button variant="ghost" size="icon" onClick={() => deleteKontakt.mutate(k.id)} data-testid={`button-delete-kontakt-${k.id}`}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                      </div>
                      {k.pozice && <p className="text-xs text-muted-foreground">{k.pozice}</p>}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {k.email && <a href={`mailto:${k.email}`} className="text-primary flex items-center gap-1"><Mail className="h-3 w-3" />{k.email}</a>}
                        {k.telefon && <a href={`tel:${k.telefon}`} className="text-primary flex items-center gap-1"><Phone className="h-3 w-3" />{k.telefon}</a>}
                        {k.linkedin && <a href={k.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1"><ExternalLink className="h-3 w-3" />LinkedIn</a>}
                      </div>
                      {k.poznamky && <p className="text-xs text-muted-foreground mt-1">{k.poznamky}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Projekty */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Projekty</h2>
              <span className="text-sm text-muted-foreground">({projekty.length})</span>
            </div>
            <Dialog open={projektOpen} onOpenChange={setProjektOpen}>
              <DialogTrigger asChild><Button size="sm" data-testid="button-add-projekt"><Plus className="h-3.5 w-3.5 mr-1" />Nový projekt</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nový projekt</DialogTitle></DialogHeader>
                <ProjektForm onSubmit={(d) => addProjekt.mutate(d)} isPending={addProjekt.isPending} submitLabel="Vytvořit" />
              </DialogContent>
            </Dialog>
          </div>

          {projekty.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Žádné projekty</p>
                <p className="text-xs text-muted-foreground mt-1">Přidejte první projekt pro tuto firmu</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projekty.map(p => (
                <ProjektCard key={p.id} projekt={p} firmaId={firmaId!} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
