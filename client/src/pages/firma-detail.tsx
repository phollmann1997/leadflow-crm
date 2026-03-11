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
import { ArrowLeft, Plus, Pencil, Trash2, Mail, Phone, Globe, MapPin, Building2, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import FirmaForm from "@/components/FirmaForm";
import { PIPELINE_LABELS, PIPELINE_COLORS, OBOR_LABELS, ZDROJ_LABELS, KOMUNIKACE_TYPY, SMER_OPTIONS, FOLLOWUP_TYPY, PRIORITA_OPTIONS, PRIORITA_COLORS } from "@shared/schema";
import type { Firma, Kontakt, Komunikace, Followup } from "@shared/schema";

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}
function formatCurrency(v: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
}

export default function FirmaDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/firmy/:id");
  const firmaId = params?.id;
  const [editOpen, setEditOpen] = useState(false);
  const [kontaktOpen, setKontaktOpen] = useState(false);
  const [komOpen, setKomOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);

  // Kontakt form state
  const [kJmeno, setKJmeno] = useState(""); const [kPrijmeni, setKPrijmeni] = useState("");
  const [kPozice, setKPozice] = useState(""); const [kEmail, setKEmail] = useState("");
  const [kTelefon, setKTelefon] = useState(""); const [kLinkedin, setKLinkedin] = useState("");
  const [kPoznamky, setKPoznamky] = useState("");

  // Komunikace form state
  const [komTyp, setKomTyp] = useState("email"); const [komSmer, setKomSmer] = useState("odchozi");
  const [komPredmet, setKomPredmet] = useState(""); const [komObsah, setKomObsah] = useState("");
  const [komOdpoved, setKomOdpoved] = useState("");

  // Followup form state
  const [fuTyp, setFuTyp] = useState("email"); const [fuPopis, setFuPopis] = useState("");
  const [fuDatum, setFuDatum] = useState(""); const [fuPriorita, setFuPriorita] = useState("stredni");

  const { data: firma, isLoading: firmaLoading } = useQuery<Firma>({ queryKey: ["/api/firmy", firmaId], enabled: !!firmaId });
  const { data: kontakty = [] } = useQuery<Kontakt[]>({ queryKey: ["/api/kontakty", `?firmaId=${firmaId}`], enabled: !!firmaId });
  const { data: komunikace = [] } = useQuery<Komunikace[]>({ queryKey: ["/api/komunikace", `?firmaId=${firmaId}`], enabled: !!firmaId });
  const { data: followupy = [] } = useQuery<Followup[]>({ queryKey: ["/api/followupy", `?firmaId=${firmaId}`], enabled: !!firmaId });

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
      toast({ title: "Kontakt pridan" });
    },
  });

  const deleteKontakt = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/kontakty/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/kontakty"] }); },
  });

  const addKomunikace = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/komunikace", { firmaId, userId: user?.id, typ: komTyp, smer: komSmer, predmet: komPredmet, obsah: komObsah, odpoved: komOdpoved || null });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/komunikace"] }); setKomOpen(false);
      setKomPredmet(""); setKomObsah(""); setKomOdpoved("");
      toast({ title: "Zaznam pridan" });
    },
  });

  const deleteKomunikace = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/komunikace/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/komunikace"] }); },
  });

  const addFollowup = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/followupy", { firmaId, userId: user?.id, typ: fuTyp, popis: fuPopis, datumPlan: new Date(fuDatum), priorita: fuPriorita });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followupy"] }); queryClient.invalidateQueries({ queryKey: ["/api/stats"] }); setFuOpen(false);
      setFuPopis(""); setFuDatum("");
      toast({ title: "Follow-up vytvoren" });
    },
  });

  const toggleFollowup = useMutation({
    mutationFn: async ({ id, splneno }: { id: string; splneno: boolean }) => {
      await apiRequest("PATCH", `/api/followupy/${id}`, { splneno, splnenoDate: splneno ? new Date() : null });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/followupy"] }); queryClient.invalidateQueries({ queryKey: ["/api/stats"] }); },
  });

  const deleteFollowup = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/followupy/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/followupy"] }); queryClient.invalidateQueries({ queryKey: ["/api/stats"] }); },
  });

  if (firmaLoading) return <div className="p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 mt-4" /></div>;
  if (!firma) return <div className="p-6"><p>Firma nenalezena</p><Link href="/firmy"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Zpět</Button></Link></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/firmy"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-xl font-semibold">{firma.nazev}</h1>
            <p className="text-sm text-muted-foreground">{OBOR_LABELS[firma.obor] ?? firma.obor}{firma.adresa ? ` · ${firma.adresa}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full ${PIPELINE_COLORS[firma.stav]}`}>{PIPELINE_LABELS[firma.stav]}</span>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild><Button variant="secondary" size="sm"><Pencil className="h-3.5 w-3.5 mr-1.5" />Upravit</Button></DialogTrigger>
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
              <div className="flex justify-between pt-2"><span className="text-muted-foreground">Hodnota</span><span className="font-medium">{formatCurrency(firma.hodnotaDealu ?? 0)}/mes.</span></div>
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
                <DialogTrigger asChild><Button size="sm" variant="secondary"><Plus className="h-3.5 w-3.5 mr-1" />Přidat</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nový kontakt</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium mb-1 block">Jméno *</label><Input value={kJmeno} onChange={e => setKJmeno(e.target.value)} /></div>
                      <div><label className="text-sm font-medium mb-1 block">Příjmení *</label><Input value={kPrijmeni} onChange={e => setKPrijmeni(e.target.value)} /></div>
                    </div>
                    <div><label className="text-sm font-medium mb-1 block">Pozice</label><Input value={kPozice} onChange={e => setKPozice(e.target.value)} placeholder="CEO, jednatel..." /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium mb-1 block">Email</label><Input value={kEmail} onChange={e => setKEmail(e.target.value)} /></div>
                      <div><label className="text-sm font-medium mb-1 block">Telefon</label><Input value={kTelefon} onChange={e => setKTelefon(e.target.value)} /></div>
                    </div>
                    <div><label className="text-sm font-medium mb-1 block">LinkedIn</label><Input value={kLinkedin} onChange={e => setKLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                    <div><label className="text-sm font-medium mb-1 block">Poznámky</label><Textarea value={kPoznamky} onChange={e => setKPoznamky(e.target.value)} rows={2} /></div>
                    <Button className="w-full" disabled={!kJmeno || !kPrijmeni} onClick={() => addKontakt.mutate()}>Přidat kontakt</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {kontakty.length === 0 ? <p className="text-sm text-muted-foreground">Žádné kontakty</p> : (
                <div className="space-y-3">
                  {kontakty.map(k => (
                    <div key={k.id} className="p-3 rounded-md border border-border/50 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{k.jmeno} {k.prijmeni}{k.jePrimarni && <Badge variant="secondary" className="text-[10px] ml-2">Hlavni</Badge>}</p>
                        <Button variant="ghost" size="icon" onClick={() => deleteKontakt.mutate(k.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
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

        {/* Right - Komunikace & Follow-upy */}
        <div className="lg:col-span-2 space-y-4">
          {/* Follow-upy */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Follow-upy & Úkoly</CardTitle>
              <Dialog open={fuOpen} onOpenChange={setFuOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nový follow-up</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nový follow-up</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div><label className="text-sm font-medium mb-1 block">Typ</label>
                      <Select value={fuTyp} onValueChange={setFuTyp}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        {FOLLOWUP_TYPY.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent></Select></div>
                    <div><label className="text-sm font-medium mb-1 block">Co udelat *</label><Input value={fuPopis} onChange={e => setFuPopis(e.target.value)} placeholder="Zavolat, poslat email..." /></div>
                    <div><label className="text-sm font-medium mb-1 block">Kdy *</label><Input type="date" value={fuDatum} onChange={e => setFuDatum(e.target.value)} /></div>
                    <div><label className="text-sm font-medium mb-1 block">Priorita</label>
                      <Select value={fuPriorita} onValueChange={setFuPriorita}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        {PRIORITA_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent></Select></div>
                    <Button className="w-full" disabled={!fuPopis || !fuDatum} onClick={() => addFollowup.mutate()}>Vytvorit</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {followupy.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Žádné follow-upy</p> : (
                <div className="space-y-2">
                  {followupy.map(fu => {
                    const overdue = !fu.splneno && new Date(fu.datumPlan) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <div key={fu.id} className={`flex items-center gap-3 p-3 rounded-md border ${overdue ? "border-red-300 dark:border-red-800" : "border-border/50"} ${fu.splneno ? "opacity-50" : ""}`}>
                        <Checkbox checked={fu.splneno ?? false} onCheckedChange={(c) => toggleFollowup.mutate({ id: fu.id, splneno: c as boolean })} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${fu.splneno ? "line-through text-muted-foreground" : "font-medium"}`}>{fu.popis}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITA_COLORS[fu.priorita]}`}>{PRIORITA_OPTIONS.find(p => p.value === fu.priorita)?.label}</span>
                            <span className="text-xs text-muted-foreground">{FOLLOWUP_TYPY.find(t => t.value === fu.typ)?.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-xs ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>{formatDate(fu.datumPlan)}</span>
                          <Button variant="ghost" size="icon" onClick={() => deleteFollowup.mutate(fu.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Komunikace log */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Historie komunikace</CardTitle>
              <Dialog open={komOpen} onOpenChange={setKomOpen}>
                <DialogTrigger asChild><Button size="sm" variant="secondary"><Plus className="h-3.5 w-3.5 mr-1" />Přidat záznam</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nový záznam komunikace</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium mb-1 block">Kanál</label>
                        <Select value={komTyp} onValueChange={setKomTyp}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                          {KOMUNIKACE_TYPY.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent></Select></div>
                      <div><label className="text-sm font-medium mb-1 block">Směr</label>
                        <Select value={komSmer} onValueChange={setKomSmer}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                          {SMER_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent></Select></div>
                    </div>
                    <div><label className="text-sm font-medium mb-1 block">Předmět *</label><Input value={komPredmet} onChange={e => setKomPredmet(e.target.value)} placeholder="O čem to bylo..." /></div>
                    <div><label className="text-sm font-medium mb-1 block">Obsah</label><Textarea value={komObsah} onChange={e => setKomObsah(e.target.value)} rows={3} placeholder="Podrobnosti..." /></div>
                    <div><label className="text-sm font-medium mb-1 block">Jejich odpověď</label><Textarea value={komOdpoved} onChange={e => setKomOdpoved(e.target.value)} rows={2} placeholder="Co říkali / napsali..." /></div>
                    <Button className="w-full" disabled={!komPredmet} onClick={() => addKomunikace.mutate()}>Uložit záznam</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {komunikace.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Žádná komunikace</p> : (
                <div className="space-y-3">
                  {komunikace.map(c => (
                    <div key={c.id} className="p-3 rounded-md border border-border/50 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{KOMUNIKACE_TYPY.find(t => t.value === c.typ)?.label ?? c.typ}</Badge>
                          <Badge variant={c.smer === "prichozi" ? "default" : "secondary"} className="text-xs">
                            {c.smer === "prichozi" ? "Prichozi" : "Odchozi"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(c.datum)}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteKomunikace.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                      </div>
                      <p className="text-sm font-medium">{c.predmet}</p>
                      {c.obsah && <p className="text-xs text-muted-foreground">{c.obsah}</p>}
                      {c.odpoved && <div className="mt-2 p-2 rounded bg-muted/50"><p className="text-xs font-medium mb-0.5">Jejich odpověď:</p><p className="text-xs text-muted-foreground">{c.odpoved}</p></div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
