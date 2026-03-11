import {
  type User, type InsertUser,
  type Firma, type InsertFirma,
  type Kontakt, type InsertKontakt,
  type Komunikace, type InsertKomunikace,
  type Followup, type InsertFollowup,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getFirmy(userId: string): Promise<Firma[]>;
  getFirma(id: string): Promise<Firma | undefined>;
  createFirma(firma: InsertFirma): Promise<Firma>;
  updateFirma(id: string, firma: Partial<InsertFirma>): Promise<Firma | undefined>;
  deleteFirma(id: string): Promise<boolean>;
  searchFirmy(userId: string, query: string): Promise<Firma[]>;

  getKontakty(firmaId: string): Promise<Kontakt[]>;
  createKontakt(kontakt: InsertKontakt): Promise<Kontakt>;
  updateKontakt(id: string, kontakt: Partial<InsertKontakt>): Promise<Kontakt | undefined>;
  deleteKontakt(id: string): Promise<boolean>;

  getKomunikace(firmaId: string): Promise<Komunikace[]>;
  createKomunikace(komunikace: InsertKomunikace): Promise<Komunikace>;
  deleteKomunikace(id: string): Promise<boolean>;

  getFollowupy(userId: string): Promise<Followup[]>;
  getFollowupyByFirma(firmaId: string): Promise<Followup[]>;
  createFollowup(followup: InsertFollowup): Promise<Followup>;
  updateFollowup(id: string, data: Partial<InsertFollowup & { splneno?: boolean; splnenoDate?: Date | null }>): Promise<Followup | undefined>;
  deleteFollowup(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private firmyMap: Map<string, Firma> = new Map();
  private kontaktyMap: Map<string, Kontakt> = new Map();
  private komunikaceMap: Map<string, Komunikace> = new Map();
  private followupyMap: Map<string, Followup> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const demoUser: User = {
      id: "demo-user-1",
      username: "petr",
      password: "heslo123",
      fullName: "Petr Hollmann",
      email: "petr.hollmann@gmail.com",
    };
    this.users.set(demoUser.id, demoUser);

    // Seed firmy
    const firmy: Firma[] = [
      {
        id: "f1", userId: "demo-user-1", nazev: "Transfaktoring a.s.", ico: "28501187",
        web: "https://transfaktoring.cz", obor: "faktoring", pocetZamestnancu: "5-10",
        ppisPodnikani: "Faktoringová společnost, zpracovávají velké množství faktur a smluv o postoupení pohledávek.",
        adresa: "Praha", poznamky: "Stávající klient. Platí měsíčně za extrakci faktur. Rozšiřujeme o RAG analýzu smluv.",
        zdroj: "doporuceni", stav: "zakaznik", hodnotaDealu: 15000, tagy: "aktivni,faktoring,rag",
        createdAt: new Date("2026-01-10"),
      },
      {
        id: "f2", userId: "demo-user-1", nazev: "BNP Paribas Faktoring", ico: "27248186",
        web: "https://factoringkb.cz", obor: "faktoring", pocetZamestnancu: "20-30",
        ppisPodnikani: "Velká faktoringová společnost, součást skupiny BNP. Zpracovávají tisíce faktur měsíčně.",
        adresa: "Praha 1", poznamky: "Velký potenciál, ale delší sales cycle. Kontaktovat přes LinkedIn.",
        zdroj: "linkedin", stav: "osloven", hodnotaDealu: 50000, tagy: "enterprise,faktoring",
        createdAt: new Date("2026-02-15"),
      },
      {
        id: "f3", userId: "demo-user-1", nazev: "Malá účetní s.r.o.", ico: "12345678",
        web: null, obor: "ucetnictvi", pocetZamestnancu: "3-5",
        ppisPodnikani: "Účetní kancelář, zpracovávají doklady pro 50+ klientů. Ruční přepis faktur.",
        adresa: "Liberec", poznamky: "Referral od kamaráda. Ideální profil - malá firma, hodně dokumentů.",
        zdroj: "doporuceni", stav: "schuzka", hodnotaDealu: 8000, tagy: "ucetnictvi,liberec",
        createdAt: new Date("2026-02-20"),
      },
      {
        id: "f4", userId: "demo-user-1", nazev: "FastLogistics s.r.o.", ico: "98765432",
        web: "https://fastlogistics.cz", obor: "logistika", pocetZamestnancu: "10-15",
        ppisPodnikani: "Spediční firma, přepravní dokumenty, CMR listy, dodací listy.",
        adresa: "Brno", poznamky: "Našel jsem je přes ARES. Hodně papírů, ale nevím jestli mají budget.",
        zdroj: "ares", stav: "novy", hodnotaDealu: 12000, tagy: "logistika,brno",
        createdAt: new Date("2026-03-01"),
      },
      {
        id: "f5", userId: "demo-user-1", nazev: "Broker Capital a.s.", ico: "55667788",
        web: "https://brokercapital.cz", obor: "makler", pocetZamestnancu: "5-10",
        ppisPodnikani: "Finanční makléř, zpracovávají pojistné smlouvy a finanční dokumenty.",
        adresa: "Praha 5", poznamky: "Odpověděli na cold email. Chtějí demo v březnu.",
        zdroj: "cold_email", stav: "odpovezel", hodnotaDealu: 20000, tagy: "makler,demo",
        createdAt: new Date("2026-02-25"),
      },
      {
        id: "f6", userId: "demo-user-1", nazev: "Česká správa nemovitostí", ico: "44556677",
        web: null, obor: "jine", pocetZamestnancu: "15-20",
        ppisPodnikani: "Správa nemovitostí, nájemní smlouvy, předávací protokoly.",
        adresa: "Plzeň", poznamky: "Mají zájem ale čekají na rozpočet Q2.",
        zdroj: "cold_call", stav: "nabidka", hodnotaDealu: 25000, tagy: "nemovitosti",
        createdAt: new Date("2026-02-10"),
      },
    ];

    for (const f of firmy) this.firmyMap.set(f.id, f);

    // Seed kontakty
    const kontakty: Kontakt[] = [
      { id: "k1", firmaId: "f1", jmeno: "Tomáš", prijmeni: "Novotný", pozice: "Jednatel", email: "novotny@transfaktoring.cz", telefon: "+420 602 111 222", linkedin: null, jePrimarni: true, poznamky: "Hlavní kontakt, rozhoduje o rozpočtu", createdAt: new Date() },
      { id: "k2", firmaId: "f2", jmeno: "Markéta", prijmeni: "Dvořáková", pozice: "Head of Operations", email: "dvorakova@factoringkb.cz", telefon: null, linkedin: "https://linkedin.com/in/dvorakova", jePrimarni: true, poznamky: "Kontaktována přes LinkedIn", createdAt: new Date() },
      { id: "k3", firmaId: "f3", jmeno: "Jana", prijmeni: "Procházková", pozice: "Jednatelka", email: "jana@malaucteni.cz", telefon: "+420 603 333 444", linkedin: null, jePrimarni: true, poznamky: "Velmi vstřícná, nadšená z automatizace", createdAt: new Date() },
      { id: "k4", firmaId: "f4", jmeno: "Petr", prijmeni: "Kučera", pozice: "Provozní ředitel", email: "kucera@fastlogistics.cz", telefon: "+420 604 555 666", linkedin: null, jePrimarni: true, poznamky: null, createdAt: new Date() },
      { id: "k5", firmaId: "f5", jmeno: "Martin", prijmeni: "Šťastný", pozice: "CEO", email: "stastny@brokercapital.cz", telefon: "+420 605 777 888", linkedin: "https://linkedin.com/in/stastny", jePrimarni: true, poznamky: "Odpověděl na cold email, chtěl demo", createdAt: new Date() },
      { id: "k6", firmaId: "f6", jmeno: "Alena", prijmeni: "Malá", pozice: "Office Manager", email: "mala@csn.cz", telefon: "+420 606 999 000", linkedin: null, jePrimarni: true, poznamky: "Kontakt od kolegy. Připravit nabídku.", createdAt: new Date() },
    ];

    for (const k of kontakty) this.kontaktyMap.set(k.id, k);

    // Seed komunikace
    const komunikace: Komunikace[] = [
      { id: "com1", firmaId: "f2", kontaktId: "k2", userId: "demo-user-1", typ: "linkedin", smer: "odchozi", predmet: "Úvodní zpráva na LinkedIn", obsah: "Dobrý den, kontaktuji vás ohledně automatizace zpracování faktur...", odpoved: null, datum: new Date("2026-02-15"), createdAt: new Date("2026-02-15") },
      { id: "com2", firmaId: "f3", kontaktId: "k3", userId: "demo-user-1", typ: "telefon", smer: "odchozi", predmet: "Úvodní hovor", obsah: "Volal jsem, domluvili jsme schůzku na 15.3.", odpoved: "Má zájem, chce vidět demo. Schůzka 15.3. v 10:00.", datum: new Date("2026-03-05"), createdAt: new Date("2026-03-05") },
      { id: "com3", firmaId: "f5", kontaktId: "k5", userId: "demo-user-1", typ: "email", smer: "odchozi", predmet: "AlgoMat - automatizace dokumentů", obsah: "Cold email s představením služby", odpoved: "Děkuji, zní to zajímavě. Můžeme si domluvit krátký call?", datum: new Date("2026-02-28"), createdAt: new Date("2026-02-28") },
      { id: "com4", firmaId: "f6", kontaktId: "k6", userId: "demo-user-1", typ: "telefon", smer: "prichozi", predmet: "Dotaz na cenu", obsah: "Alena volala, ptala se na ceník a možnosti integrace.", odpoved: null, datum: new Date("2026-03-08"), createdAt: new Date("2026-03-08") },
      { id: "com5", firmaId: "f6", kontaktId: "k6", userId: "demo-user-1", typ: "email", smer: "odchozi", predmet: "Cenová nabídka", obsah: "Odeslána cenová nabídka na zpracování nájemních smluv.", odpoved: null, datum: new Date("2026-03-09"), createdAt: new Date("2026-03-09") },
    ];

    for (const c of komunikace) this.komunikaceMap.set(c.id, c);

    // Seed followupy
    const followupy: Followup[] = [
      { id: "fu1", firmaId: "f2", userId: "demo-user-1", typ: "linkedin", popis: "Follow-up na LinkedIn zprávu, připomenout se", datumPlan: new Date("2026-03-12"), splneno: false, splnenoDate: null, priorita: "stredni", createdAt: new Date() },
      { id: "fu2", firmaId: "f3", userId: "demo-user-1", typ: "schuzka", popis: "Schůzka s Janou - demo AlgoMat", datumPlan: new Date("2026-03-15"), splneno: false, splnenoDate: null, priorita: "vysoka", createdAt: new Date() },
      { id: "fu3", firmaId: "f4", userId: "demo-user-1", typ: "email", popis: "Poslat úvodní email Petru Kučerovi", datumPlan: new Date("2026-03-11"), splneno: false, splnenoDate: null, priorita: "stredni", createdAt: new Date() },
      { id: "fu4", firmaId: "f5", userId: "demo-user-1", typ: "telefon", popis: "Zavolat Martinovi, domluvit termín dema", datumPlan: new Date("2026-03-13"), splneno: false, splnenoDate: null, priorita: "vysoka", createdAt: new Date() },
      { id: "fu5", firmaId: "f6", userId: "demo-user-1", typ: "email", popis: "Follow-up na cenovou nabídku - ptát se na rozpočet", datumPlan: new Date("2026-03-18"), splneno: false, splnenoDate: null, priorita: "nizka", createdAt: new Date() },
      { id: "fu6", firmaId: "f1", userId: "demo-user-1", typ: "schuzka", popis: "Prezentace RAG analýzy smluv pro TRFA", datumPlan: new Date("2026-03-20"), splneno: false, splnenoDate: null, priorita: "vysoka", createdAt: new Date() },
    ];

    for (const f of followupy) this.followupyMap.set(f.id, f);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  // Firmy
  async getFirmy(userId: string): Promise<Firma[]> {
    return Array.from(this.firmyMap.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }
  async getFirma(id: string): Promise<Firma | undefined> { return this.firmyMap.get(id); }
  async createFirma(data: InsertFirma): Promise<Firma> {
    const id = randomUUID();
    const firma: Firma = {
      id, userId: data.userId, nazev: data.nazev, ico: data.ico ?? null,
      web: data.web ?? null, obor: data.obor ?? "jine", pocetZamestnancu: data.pocetZamestnancu ?? null,
      ppisPodnikani: data.ppisPodnikani ?? null, adresa: data.adresa ?? null,
      poznamky: data.poznamky ?? null, zdroj: data.zdroj ?? "jine", stav: data.stav ?? "novy",
      hodnotaDealu: data.hodnotaDealu ?? 0, tagy: data.tagy ?? null, createdAt: new Date(),
    };
    this.firmyMap.set(id, firma);
    return firma;
  }
  async updateFirma(id: string, updates: Partial<InsertFirma>): Promise<Firma | undefined> {
    const f = this.firmyMap.get(id);
    if (!f) return undefined;
    const updated = { ...f, ...updates } as Firma;
    this.firmyMap.set(id, updated);
    return updated;
  }
  async deleteFirma(id: string): Promise<boolean> {
    // cascade delete kontakty, komunikace, followupy
    for (const [kid, k] of this.kontaktyMap) { if (k.firmaId === id) this.kontaktyMap.delete(kid); }
    for (const [cid, c] of this.komunikaceMap) { if (c.firmaId === id) this.komunikaceMap.delete(cid); }
    for (const [fid, f] of this.followupyMap) { if (f.firmaId === id) this.followupyMap.delete(fid); }
    return this.firmyMap.delete(id);
  }
  async searchFirmy(userId: string, query: string): Promise<Firma[]> {
    const q = query.toLowerCase();
    return Array.from(this.firmyMap.values()).filter(f => {
      if (f.userId !== userId) return false;
      return f.nazev.toLowerCase().includes(q) ||
        (f.ico?.includes(q) ?? false) ||
        (f.obor?.toLowerCase().includes(q) ?? false) ||
        (f.tagy?.toLowerCase().includes(q) ?? false) ||
        (f.adresa?.toLowerCase().includes(q) ?? false) ||
        (f.poznamky?.toLowerCase().includes(q) ?? false);
    });
  }

  // Kontakty
  async getKontakty(firmaId: string): Promise<Kontakt[]> {
    return Array.from(this.kontaktyMap.values()).filter(k => k.firmaId === firmaId);
  }
  async createKontakt(data: InsertKontakt): Promise<Kontakt> {
    const id = randomUUID();
    const k: Kontakt = {
      id, firmaId: data.firmaId, jmeno: data.jmeno, prijmeni: data.prijmeni,
      pozice: data.pozice ?? null, email: data.email ?? null, telefon: data.telefon ?? null,
      linkedin: data.linkedin ?? null, jePrimarni: data.jePrimarni ?? true,
      poznamky: data.poznamky ?? null, createdAt: new Date(),
    };
    this.kontaktyMap.set(id, k);
    return k;
  }
  async updateKontakt(id: string, updates: Partial<InsertKontakt>): Promise<Kontakt | undefined> {
    const k = this.kontaktyMap.get(id);
    if (!k) return undefined;
    const updated = { ...k, ...updates } as Kontakt;
    this.kontaktyMap.set(id, updated);
    return updated;
  }
  async deleteKontakt(id: string): Promise<boolean> { return this.kontaktyMap.delete(id); }

  // Komunikace
  async getKomunikace(firmaId: string): Promise<Komunikace[]> {
    return Array.from(this.komunikaceMap.values())
      .filter(c => c.firmaId === firmaId)
      .sort((a, b) => (b.datum?.getTime() ?? 0) - (a.datum?.getTime() ?? 0));
  }
  async createKomunikace(data: InsertKomunikace): Promise<Komunikace> {
    const id = randomUUID();
    const c: Komunikace = {
      id, firmaId: data.firmaId, kontaktId: data.kontaktId ?? null,
      userId: data.userId, typ: data.typ, smer: data.smer ?? "odchozi",
      predmet: data.predmet, obsah: data.obsah ?? null, odpoved: data.odpoved ?? null,
      datum: data.datum ?? new Date(), createdAt: new Date(),
    };
    this.komunikaceMap.set(id, c);
    return c;
  }
  async deleteKomunikace(id: string): Promise<boolean> { return this.komunikaceMap.delete(id); }

  // Followupy
  async getFollowupy(userId: string): Promise<Followup[]> {
    return Array.from(this.followupyMap.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => (a.datumPlan?.getTime() ?? 0) - (b.datumPlan?.getTime() ?? 0));
  }
  async getFollowupyByFirma(firmaId: string): Promise<Followup[]> {
    return Array.from(this.followupyMap.values())
      .filter(f => f.firmaId === firmaId)
      .sort((a, b) => (a.datumPlan?.getTime() ?? 0) - (b.datumPlan?.getTime() ?? 0));
  }
  async createFollowup(data: InsertFollowup): Promise<Followup> {
    const id = randomUUID();
    const f: Followup = {
      id, firmaId: data.firmaId, userId: data.userId, typ: data.typ,
      popis: data.popis, datumPlan: data.datumPlan, splneno: data.splneno ?? false,
      splnenoDate: null, priorita: data.priorita ?? "stredni", createdAt: new Date(),
    };
    this.followupyMap.set(id, f);
    return f;
  }
  async updateFollowup(id: string, updates: any): Promise<Followup | undefined> {
    const f = this.followupyMap.get(id);
    if (!f) return undefined;
    const updated = { ...f, ...updates } as Followup;
    this.followupyMap.set(id, updated);
    return updated;
  }
  async deleteFollowup(id: string): Promise<boolean> { return this.followupyMap.delete(id); }
}

export const storage = new MemStorage();
