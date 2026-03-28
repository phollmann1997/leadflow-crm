import {
  type Firma, type InsertFirma,
  type Kontakt, type InsertKontakt,
  type Komunikace, type InsertKomunikace,
  type Followup, type InsertFollowup,
  type Projekt, type InsertProjekt,
} from "@shared/schema";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface IStorage {
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
  getFollowupyByProjekt(projektId: string): Promise<Followup[]>;
  createFollowup(followup: InsertFollowup): Promise<Followup>;
  updateFollowup(id: string, data: Partial<InsertFollowup & { splneno?: boolean; splnenoDate?: Date | null }>): Promise<Followup | undefined>;
  deleteFollowup(id: string): Promise<boolean>;

  getProjekty(firmaId: string): Promise<Projekt[]>;
  getProjektyByUser(userId: string): Promise<Projekt[]>;
  getProjekt(id: string): Promise<Projekt | undefined>;
  createProjekt(projekt: InsertProjekt): Promise<Projekt>;
  updateProjekt(id: string, data: Partial<InsertProjekt>): Promise<Projekt | undefined>;
  deleteProjekt(id: string): Promise<boolean>;
}

// Helper: Supabase snake_case row → TypeScript camelCase
function rowToFirma(r: any): Firma {
  return {
    id: r.id, userId: r.user_id, nazev: r.nazev, ico: r.ico, web: r.web,
    obor: r.obor, pocetZamestnancu: r.pocet_zamestnancu, ppisPodnikani: r.popis_podnikani,
    adresa: r.adresa, poznamky: r.poznamky, zdroj: r.zdroj, stav: r.stav,
    hodnotaDealu: r.hodnota_dealu, tagy: r.tagy,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToKontakt(r: any): Kontakt {
  return {
    id: r.id, firmaId: r.firma_id, jmeno: r.jmeno, prijmeni: r.prijmeni,
    pozice: r.pozice, email: r.email, telefon: r.telefon, linkedin: r.linkedin,
    jePrimarni: r.je_primarni, poznamky: r.poznamky,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToKomunikace(r: any): Komunikace {
  return {
    id: r.id, firmaId: r.firma_id, kontaktId: r.kontakt_id, userId: r.user_id,
    projektId: r.projekt_id ?? null,
    typ: r.typ, smer: r.smer, predmet: r.predmet, obsah: r.obsah, odpoved: r.odpoved,
    datum: r.datum ? new Date(r.datum) : null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToFollowup(r: any): Followup {
  return {
    id: r.id, firmaId: r.firma_id, userId: r.user_id, projektId: r.projekt_id ?? null,
    typ: r.typ, popis: r.popis,
    datumPlan: r.datum_plan ? new Date(r.datum_plan) : new Date(),
    splneno: r.splneno, splnenoDate: r.splneno_date ? new Date(r.splneno_date) : null,
    priorita: r.priorita,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToProjekt(r: any): Projekt {
  return {
    id: r.id, firmaId: r.firma_id, userId: r.user_id,
    nazev: r.nazev, popis: r.popis, stav: r.stav,
    hodnotaDealu: r.hodnota_dealu,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function projektToRow(data: Partial<InsertProjekt>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.firmaId !== undefined) row.firma_id = data.firmaId;
  if (data.userId !== undefined) row.user_id = data.userId;
  if (data.nazev !== undefined) row.nazev = data.nazev;
  if (data.popis !== undefined) row.popis = data.popis;
  if (data.stav !== undefined) row.stav = data.stav;
  if (data.hodnotaDealu !== undefined) row.hodnota_dealu = data.hodnotaDealu;
  return row;
}

// Helper: camelCase InsertFirma → snake_case for Supabase
function firmaToRow(data: Partial<InsertFirma>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.userId !== undefined) row.user_id = data.userId;
  if (data.nazev !== undefined) row.nazev = data.nazev;
  if (data.ico !== undefined) row.ico = data.ico;
  if (data.web !== undefined) row.web = data.web;
  if (data.obor !== undefined) row.obor = data.obor;
  if (data.pocetZamestnancu !== undefined) row.pocet_zamestnancu = data.pocetZamestnancu;
  if (data.ppisPodnikani !== undefined) row.popis_podnikani = data.ppisPodnikani;
  if (data.adresa !== undefined) row.adresa = data.adresa;
  if (data.poznamky !== undefined) row.poznamky = data.poznamky;
  if (data.zdroj !== undefined) row.zdroj = data.zdroj;
  if (data.stav !== undefined) row.stav = data.stav;
  if (data.hodnotaDealu !== undefined) row.hodnota_dealu = data.hodnotaDealu;
  if (data.tagy !== undefined) row.tagy = data.tagy;
  return row;
}

function kontaktToRow(data: Partial<InsertKontakt>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.firmaId !== undefined) row.firma_id = data.firmaId;
  if (data.jmeno !== undefined) row.jmeno = data.jmeno;
  if (data.prijmeni !== undefined) row.prijmeni = data.prijmeni;
  if (data.pozice !== undefined) row.pozice = data.pozice;
  if (data.email !== undefined) row.email = data.email;
  if (data.telefon !== undefined) row.telefon = data.telefon;
  if (data.linkedin !== undefined) row.linkedin = data.linkedin;
  if (data.jePrimarni !== undefined) row.je_primarni = data.jePrimarni;
  if (data.poznamky !== undefined) row.poznamky = data.poznamky;
  return row;
}

function komunikaceToRow(data: Partial<InsertKomunikace>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.firmaId !== undefined) row.firma_id = data.firmaId;
  if (data.kontaktId !== undefined) row.kontakt_id = data.kontaktId;
  if (data.userId !== undefined) row.user_id = data.userId;
  if (data.projektId !== undefined) row.projekt_id = data.projektId;
  if (data.typ !== undefined) row.typ = data.typ;
  if (data.smer !== undefined) row.smer = data.smer;
  if (data.predmet !== undefined) row.predmet = data.predmet;
  if (data.obsah !== undefined) row.obsah = data.obsah;
  if (data.odpoved !== undefined) row.odpoved = data.odpoved;
  if (data.datum !== undefined) row.datum = data.datum instanceof Date ? data.datum.toISOString() : data.datum;
  return row;
}

function followupToRow(data: Partial<InsertFollowup & { splneno?: boolean; splnenoDate?: Date | null }>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.firmaId !== undefined) row.firma_id = data.firmaId;
  if (data.userId !== undefined) row.user_id = data.userId;
  if (data.projektId !== undefined) row.projekt_id = data.projektId;
  if (data.typ !== undefined) row.typ = data.typ;
  if (data.popis !== undefined) row.popis = data.popis;
  if (data.datumPlan !== undefined) row.datum_plan = data.datumPlan instanceof Date ? data.datumPlan.toISOString() : data.datumPlan;
  if (data.splneno !== undefined) row.splneno = data.splneno;
  if (data.splnenoDate !== undefined) row.splneno_date = data.splnenoDate instanceof Date ? data.splnenoDate.toISOString() : data.splnenoDate;
  if (data.priorita !== undefined) row.priorita = data.priorita;
  return row;
}


export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL || "https://ajbvjnqpxoqsvlmwpxxu.supabase.co";
    const key = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnZqbnFweG9xc3ZsbXdweHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDA0NjUsImV4cCI6MjA4ODgxNjQ2NX0.1Fqrj3wb9ezl65Yop7AjGoa9_5N5cMG-AenD9xlV75k";
    this.supabase = createClient(url, key);
  }

  // ========== Firmy ==========
  async getFirmy(userId: string): Promise<Firma[]> {
    const { data } = await this.supabase
      .from("firmy").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return (data ?? []).map(rowToFirma);
  }

  async getFirma(id: string): Promise<Firma | undefined> {
    const { data } = await this.supabase.from("firmy").select("*").eq("id", id).single();
    return data ? rowToFirma(data) : undefined;
  }

  async createFirma(insertData: InsertFirma): Promise<Firma> {
    const row = firmaToRow(insertData);
    const { data, error } = await this.supabase.from("firmy").insert(row).select().single();
    if (error) throw new Error(`Failed to create firma: ${error.message}`);
    return rowToFirma(data);
  }

  async updateFirma(id: string, updates: Partial<InsertFirma>): Promise<Firma | undefined> {
    const row = firmaToRow(updates);
    const { data, error } = await this.supabase.from("firmy").update(row).eq("id", id).select().single();
    if (error) return undefined;
    return data ? rowToFirma(data) : undefined;
  }

  async deleteFirma(id: string): Promise<boolean> {
    // cascade: delete kontakty, komunikace, followupy, projekty for this firma
    await this.supabase.from("kontakty").delete().eq("firma_id", id);
    await this.supabase.from("komunikace").delete().eq("firma_id", id);
    await this.supabase.from("followupy").delete().eq("firma_id", id);
    await this.supabase.from("projekty").delete().eq("firma_id", id);
    const { error } = await this.supabase.from("firmy").delete().eq("id", id);
    return !error;
  }

  async searchFirmy(userId: string, query: string): Promise<Firma[]> {
    const q = query.toLowerCase();
    // Supabase doesn't support OR across multiple columns easily with ilike,
    // so fetch all user's firmy and filter in memory (small dataset)
    const { data } = await this.supabase.from("firmy").select("*").eq("user_id", userId);
    const all = (data ?? []).map(rowToFirma);
    return all.filter(f => {
      return f.nazev.toLowerCase().includes(q) ||
        (f.ico?.includes(q) ?? false) ||
        (f.obor?.toLowerCase().includes(q) ?? false) ||
        (f.tagy?.toLowerCase().includes(q) ?? false) ||
        (f.adresa?.toLowerCase().includes(q) ?? false) ||
        (f.poznamky?.toLowerCase().includes(q) ?? false);
    });
  }

  // ========== Kontakty ==========
  async getKontakty(firmaId: string): Promise<Kontakt[]> {
    const { data } = await this.supabase.from("kontakty").select("*").eq("firma_id", firmaId);
    return (data ?? []).map(rowToKontakt);
  }

  async createKontakt(insertData: InsertKontakt): Promise<Kontakt> {
    const row = kontaktToRow(insertData);
    const { data, error } = await this.supabase.from("kontakty").insert(row).select().single();
    if (error) throw new Error(`Failed to create kontakt: ${error.message}`);
    return rowToKontakt(data);
  }

  async updateKontakt(id: string, updates: Partial<InsertKontakt>): Promise<Kontakt | undefined> {
    const row = kontaktToRow(updates);
    const { data, error } = await this.supabase.from("kontakty").update(row).eq("id", id).select().single();
    if (error) return undefined;
    return data ? rowToKontakt(data) : undefined;
  }

  async deleteKontakt(id: string): Promise<boolean> {
    const { error } = await this.supabase.from("kontakty").delete().eq("id", id);
    return !error;
  }

  // ========== Komunikace ==========
  async getKomunikace(firmaId: string): Promise<Komunikace[]> {
    const { data } = await this.supabase
      .from("komunikace").select("*").eq("firma_id", firmaId).order("datum", { ascending: false });
    return (data ?? []).map(rowToKomunikace);
  }

  async createKomunikace(insertData: InsertKomunikace): Promise<Komunikace> {
    const row = komunikaceToRow(insertData);
    const { data, error } = await this.supabase.from("komunikace").insert(row).select().single();
    if (error) throw new Error(`Failed to create komunikace: ${error.message}`);
    return rowToKomunikace(data);
  }

  async deleteKomunikace(id: string): Promise<boolean> {
    const { error } = await this.supabase.from("komunikace").delete().eq("id", id);
    return !error;
  }

  // ========== Followupy ==========
  async getFollowupy(userId: string): Promise<Followup[]> {
    const { data } = await this.supabase
      .from("followupy").select("*").eq("user_id", userId).order("datum_plan", { ascending: true });
    return (data ?? []).map(rowToFollowup);
  }

  async getFollowupyByFirma(firmaId: string): Promise<Followup[]> {
    const { data } = await this.supabase
      .from("followupy").select("*").eq("firma_id", firmaId).order("datum_plan", { ascending: true });
    return (data ?? []).map(rowToFollowup);
  }

  async createFollowup(insertData: InsertFollowup): Promise<Followup> {
    const row = followupToRow(insertData);
    const { data, error } = await this.supabase.from("followupy").insert(row).select().single();
    if (error) throw new Error(`Failed to create followup: ${error.message}`);
    return rowToFollowup(data);
  }

  async updateFollowup(id: string, updates: Partial<InsertFollowup & { splneno?: boolean; splnenoDate?: Date | null }>): Promise<Followup | undefined> {
    const row = followupToRow(updates);
    const { data, error } = await this.supabase.from("followupy").update(row).eq("id", id).select().single();
    if (error) return undefined;
    return data ? rowToFollowup(data) : undefined;
  }

  async getFollowupyByProjekt(projektId: string): Promise<Followup[]> {
    const { data } = await this.supabase
      .from("followupy").select("*").eq("projekt_id", projektId).order("datum_plan", { ascending: true });
    return (data ?? []).map(rowToFollowup);
  }

  async deleteFollowup(id: string): Promise<boolean> {
    const { error } = await this.supabase.from("followupy").delete().eq("id", id);
    return !error;
  }

  // ========== Projekty ==========
  async getProjekty(firmaId: string): Promise<Projekt[]> {
    const { data } = await this.supabase
      .from("projekty").select("*").eq("firma_id", firmaId).order("created_at", { ascending: false });
    return (data ?? []).map(rowToProjekt);
  }

  async getProjektyByUser(userId: string): Promise<Projekt[]> {
    const { data } = await this.supabase
      .from("projekty").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return (data ?? []).map(rowToProjekt);
  }

  async getProjekt(id: string): Promise<Projekt | undefined> {
    const { data } = await this.supabase.from("projekty").select("*").eq("id", id).single();
    return data ? rowToProjekt(data) : undefined;
  }

  async createProjekt(insertData: InsertProjekt): Promise<Projekt> {
    const row = projektToRow(insertData);
    const { data, error } = await this.supabase.from("projekty").insert(row).select().single();
    if (error) throw new Error(`Failed to create projekt: ${error.message}`);
    return rowToProjekt(data);
  }

  async updateProjekt(id: string, updates: Partial<InsertProjekt>): Promise<Projekt | undefined> {
    const row = projektToRow(updates);
    const { data, error } = await this.supabase.from("projekty").update(row).eq("id", id).select().single();
    if (error) return undefined;
    return data ? rowToProjekt(data) : undefined;
  }

  async deleteProjekt(id: string): Promise<boolean> {
    await this.supabase.from("followupy").delete().eq("projekt_id", id);
    await this.supabase.from("komunikace").delete().eq("projekt_id", id);
    const { error } = await this.supabase.from("projekty").delete().eq("id", id);
    return !error;
  }
}

export const storage = new SupabaseStorage();
