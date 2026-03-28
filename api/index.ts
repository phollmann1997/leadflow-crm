import express, { type Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Supabase Storage (inline for serverless - no file imports)
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL || "https://ajbvjnqpxoqsvlmwpxxu.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnZqbnFweG9xc3ZsbXdweHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDA0NjUsImV4cCI6MjA4ODgxNjQ2NX0.1Fqrj3wb9ezl65Yop7AjGoa9_5N5cMG-AenD9xlV75k";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// Row <-> camelCase mapping
// ============================================================

function rowToFirma(r: any) {
  return {
    id: r.id, userId: r.user_id, nazev: r.nazev, ico: r.ico, web: r.web,
    obor: r.obor, pocetZamestnancu: r.pocet_zamestnancu, ppisPodnikani: r.popis_podnikani,
    adresa: r.adresa, poznamky: r.poznamky, zdroj: r.zdroj, stav: r.stav,
    hodnotaDealu: r.hodnota_dealu, tagy: r.tagy,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToKontakt(r: any) {
  return {
    id: r.id, firmaId: r.firma_id, jmeno: r.jmeno, prijmeni: r.prijmeni,
    pozice: r.pozice, email: r.email, telefon: r.telefon, linkedin: r.linkedin,
    jePrimarni: r.je_primarni, poznamky: r.poznamky,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToKomunikace(r: any) {
  return {
    id: r.id, firmaId: r.firma_id, kontaktId: r.kontakt_id, userId: r.user_id,
    projektId: r.projekt_id ?? null,
    typ: r.typ, smer: r.smer, predmet: r.predmet, obsah: r.obsah, odpoved: r.odpoved,
    datum: r.datum ? new Date(r.datum) : null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToFollowup(r: any) {
  return {
    id: r.id, firmaId: r.firma_id, userId: r.user_id, projektId: r.projekt_id ?? null,
    typ: r.typ, popis: r.popis,
    datumPlan: r.datum_plan ? new Date(r.datum_plan) : new Date(),
    splneno: r.splneno, splnenoDate: r.splneno_date ? new Date(r.splneno_date) : null,
    priorita: r.priorita,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function rowToProjekt(r: any) {
  return {
    id: r.id, firmaId: r.firma_id, userId: r.user_id,
    nazev: r.nazev, popis: r.popis, stav: r.stav,
    hodnotaDealu: r.hodnota_dealu,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function projektToRow(data: any) {
  const row: any = {};
  if (data.firmaId !== undefined) row.firma_id = data.firmaId;
  if (data.userId !== undefined) row.user_id = data.userId;
  if (data.nazev !== undefined) row.nazev = data.nazev;
  if (data.popis !== undefined) row.popis = data.popis;
  if (data.stav !== undefined) row.stav = data.stav;
  if (data.hodnotaDealu !== undefined) row.hodnota_dealu = data.hodnotaDealu;
  return row;
}

function firmaToRow(data: any) {
  const row: any = {};
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

function kontaktToRow(data: any) {
  const row: any = {};
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

function komunikaceToRow(data: any) {
  const row: any = {};
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

function followupToRow(data: any) {
  const row: any = {};
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

// ============================================================
// Express app
// ============================================================

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for Vercel
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") return res.status(200).end();
  next();
});

// ============================================================
// Routes
// ============================================================

// Firmy
app.get("/api/firmy", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const search = req.query.search as string;

    if (search) {
      const q = search.toLowerCase();
      const { data } = await supabase.from("firmy").select("*").eq("user_id", userId);
      const all = (data ?? []).map(rowToFirma);
      const filtered = all.filter((f: any) =>
        f.nazev.toLowerCase().includes(q) ||
        (f.ico?.includes(q) ?? false) ||
        (f.obor?.toLowerCase().includes(q) ?? false) ||
        (f.tagy?.toLowerCase().includes(q) ?? false) ||
        (f.adresa?.toLowerCase().includes(q) ?? false) ||
        (f.poznamky?.toLowerCase().includes(q) ?? false)
      );
      return res.json(filtered);
    }

    const { data } = await supabase.from("firmy").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return res.json((data ?? []).map(rowToFirma));
  } catch (error) {
    return res.status(500).json({ error: "Chyba při načítání firem" });
  }
});

app.get("/api/firmy/:id", async (req, res) => {
  try {
    const { data } = await supabase.from("firmy").select("*").eq("id", req.params.id).single();
    if (!data) return res.status(404).json({ error: "Firma nenalezena" });
    return res.json(rowToFirma(data));
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.post("/api/firmy", async (req, res) => {
  try {
    const row = firmaToRow(req.body);
    const { data, error } = await supabase.from("firmy").insert(row).select().single();
    if (error) throw error;
    return res.status(201).json(rowToFirma(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se vytvořit firmu" });
  }
});

app.patch("/api/firmy/:id", async (req, res) => {
  try {
    const row = firmaToRow(req.body);
    const { data, error } = await supabase.from("firmy").update(row).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ error: "Firma nenalezena" });
    return res.json(rowToFirma(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se upravit firmu" });
  }
});

app.delete("/api/firmy/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await supabase.from("kontakty").delete().eq("firma_id", id);
    await supabase.from("komunikace").delete().eq("firma_id", id);
    await supabase.from("followupy").delete().eq("firma_id", id);
    await supabase.from("projekty").delete().eq("firma_id", id);
    const { error } = await supabase.from("firmy").delete().eq("id", id);
    if (error) return res.status(404).json({ error: "Firma nenalezena" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se smazat firmu" });
  }
});

// Kontakty
app.get("/api/kontakty", async (req, res) => {
  try {
    const firmaId = req.query.firmaId as string;
    if (!firmaId) return res.status(400).json({ error: "firmaId required" });
    const { data } = await supabase.from("kontakty").select("*").eq("firma_id", firmaId);
    return res.json((data ?? []).map(rowToKontakt));
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.post("/api/kontakty", async (req, res) => {
  try {
    const row = kontaktToRow(req.body);
    const { data, error } = await supabase.from("kontakty").insert(row).select().single();
    if (error) throw error;
    return res.status(201).json(rowToKontakt(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se vytvořit kontakt" });
  }
});

app.patch("/api/kontakty/:id", async (req, res) => {
  try {
    const row = kontaktToRow(req.body);
    const { data, error } = await supabase.from("kontakty").update(row).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ error: "Kontakt nenalezen" });
    return res.json(rowToKontakt(data));
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.delete("/api/kontakty/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("kontakty").delete().eq("id", req.params.id);
    if (error) return res.status(404).json({ error: "Kontakt nenalezen" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

// Komunikace
app.get("/api/komunikace", async (req, res) => {
  try {
    const firmaId = req.query.firmaId as string;
    if (!firmaId) return res.status(400).json({ error: "firmaId required" });
    const { data } = await supabase.from("komunikace").select("*").eq("firma_id", firmaId).order("datum", { ascending: false });
    return res.json((data ?? []).map(rowToKomunikace));
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.post("/api/komunikace", async (req, res) => {
  try {
    const row = komunikaceToRow(req.body);
    const { data, error } = await supabase.from("komunikace").insert(row).select().single();
    if (error) throw error;
    return res.status(201).json(rowToKomunikace(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se přidat záznam" });
  }
});

app.delete("/api/komunikace/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("komunikace").delete().eq("id", req.params.id);
    if (error) return res.status(404).json({ error: "Záznam nenalezen" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

// Projekty
app.get("/api/projekty", async (req, res) => {
  try {
    const firmaId = req.query.firmaId as string;
    const userId = req.query.userId as string;
    if (firmaId) {
      const { data } = await supabase.from("projekty").select("*").eq("firma_id", firmaId).order("created_at", { ascending: false });
      return res.json((data ?? []).map(rowToProjekt));
    }
    if (userId) {
      const { data } = await supabase.from("projekty").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      return res.json((data ?? []).map(rowToProjekt));
    }
    return res.status(400).json({ error: "firmaId or userId required" });
  } catch (error) {
    return res.status(500).json({ error: "Chyba při načítání projektů" });
  }
});

app.get("/api/projekty/:id", async (req, res) => {
  try {
    const { data } = await supabase.from("projekty").select("*").eq("id", req.params.id).single();
    if (!data) return res.status(404).json({ error: "Projekt nenalezen" });
    return res.json(rowToProjekt(data));
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.post("/api/projekty", async (req, res) => {
  try {
    const row = projektToRow(req.body);
    const { data, error } = await supabase.from("projekty").insert(row).select().single();
    if (error) throw error;
    return res.status(201).json(rowToProjekt(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se vytvořit projekt" });
  }
});

app.patch("/api/projekty/:id", async (req, res) => {
  try {
    const row = projektToRow(req.body);
    const { data, error } = await supabase.from("projekty").update(row).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ error: "Projekt nenalezen" });
    return res.json(rowToProjekt(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se upravit projekt" });
  }
});

app.delete("/api/projekty/:id", async (req, res) => {
  try {
    await supabase.from("followupy").delete().eq("projekt_id", req.params.id);
    await supabase.from("komunikace").delete().eq("projekt_id", req.params.id);
    const { error } = await supabase.from("projekty").delete().eq("id", req.params.id);
    if (error) return res.status(404).json({ error: "Projekt nenalezen" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se smazat projekt" });
  }
});

// Followupy
app.get("/api/followupy", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const firmaId = req.query.firmaId as string;
    const projektId = req.query.projektId as string;
    if (projektId) {
      const { data } = await supabase.from("followupy").select("*").eq("projekt_id", projektId).order("datum_plan", { ascending: true });
      return res.json((data ?? []).map(rowToFollowup));
    }
    if (firmaId) {
      const { data } = await supabase.from("followupy").select("*").eq("firma_id", firmaId).order("datum_plan", { ascending: true });
      return res.json((data ?? []).map(rowToFollowup));
    }
    if (userId) {
      const { data } = await supabase.from("followupy").select("*").eq("user_id", userId).order("datum_plan", { ascending: true });
      return res.json((data ?? []).map(rowToFollowup));
    }
    return res.status(400).json({ error: "userId, firmaId or projektId required" });
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.post("/api/followupy", async (req, res) => {
  try {
    const row = followupToRow(req.body);
    const { data, error } = await supabase.from("followupy").insert(row).select().single();
    if (error) throw error;
    return res.status(201).json(rowToFollowup(data));
  } catch (error) {
    return res.status(500).json({ error: "Nepodařilo se vytvořit follow-up" });
  }
});

app.patch("/api/followupy/:id", async (req, res) => {
  try {
    const row = followupToRow(req.body);
    const { data, error } = await supabase.from("followupy").update(row).eq("id", req.params.id).select().single();
    if (error) return res.status(404).json({ error: "Follow-up nenalezen" });
    return res.json(rowToFollowup(data));
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

app.delete("/api/followupy/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("followupy").delete().eq("id", req.params.id);
    if (error) return res.status(404).json({ error: "Follow-up nenalezen" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

// Dashboard stats
app.get("/api/stats", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const { data: firmyData } = await supabase.from("firmy").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const firmy = (firmyData ?? []).map(rowToFirma);

    const { data: projektyData } = await supabase.from("projekty").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const projekty = (projektyData ?? []).map(rowToProjekt);

    const { data: fuData } = await supabase.from("followupy").select("*").eq("user_id", userId).order("datum_plan", { ascending: true });
    const followupy = (fuData ?? []).map(rowToFollowup);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const nesplneneFollowupy = followupy.filter((f: any) => !f.splneno);
    const prosleFU = nesplneneFollowupy.filter((f: any) => new Date(f.datumPlan) < today);
    const dnesFU = nesplneneFollowupy.filter((f: any) => {
      const d = new Date(f.datumPlan);
      return d >= today && d < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });
    const bliziciFU = nesplneneFollowupy.filter((f: any) => {
      const d = new Date(f.datumPlan);
      return d >= today && d <= in3Days;
    });

    const stavDistribuce = projekty.reduce((acc: any, p: any) => {
      acc[p.stav] = (acc[p.stav] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const celkovaHodnota = projekty.reduce((s: number, p: any) => s + (p.hodnotaDealu ?? 0), 0);
    const aktivniLeady = projekty.filter((p: any) => !["zakaznik", "nezajem"].includes(p.stav)).length;

    return res.json({
      celkemFirem: firmy.length,
      aktivniLeady,
      celkovaHodnota,
      zakazniku: projekty.filter((p: any) => p.stav === "zakaznik").length,
      stavDistribuce,
      prosleFU: prosleFU.length,
      dnesFU: dnesFU.length,
      bliziciFU: bliziciFU.length,
      followupyDnes: dnesFU,
      followupyProsle: prosleFU,
      followupyBlizici: bliziciFU.slice(0, 10),
      nedavneFiremy: firmy.slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({ error: "Chyba" });
  }
});

// Lead Finder - ARES proxy
app.post("/api/ares/vyhledat", async (req, res) => {
  try {
    const { obchodniJmeno, ico, sidlo, start = 0, pocet = 20 } = req.body;
    const body: any = { start, pocet };
    if (obchodniJmeno) body.obchodniJmeno = obchodniJmeno;
    if (ico) body.ico = ico;
    if (sidlo?.kodKraje) body.sidlo = { kodKraje: sidlo.kodKraje };

    const response = await fetch(
      "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "ARES hledání selhalo" });
  }
});

app.get("/api/ares/subjekt/:ico", async (req, res) => {
  try {
    const response = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${req.params.ico}`,
      { headers: { "Accept": "application/json" } }
    );
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "ARES detail selhal" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
