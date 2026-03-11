import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Neplatné přihlašovací údaje" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ error: "Přihlášení selhalo" });
    }
  });

  // Firmy
  app.get("/api/firmy", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId required" });
      const search = req.query.search as string;
      const firmy = search
        ? await storage.searchFirmy(userId, search)
        : await storage.getFirmy(userId);
      return res.json(firmy);
    } catch (error) {
      return res.status(500).json({ error: "Chyba při načítání firem" });
    }
  });

  app.get("/api/firmy/:id", async (req, res) => {
    try {
      const firma = await storage.getFirma(req.params.id);
      if (!firma) return res.status(404).json({ error: "Firma nenalezena" });
      return res.json(firma);
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/firmy", async (req, res) => {
    try {
      const firma = await storage.createFirma(req.body);
      return res.status(201).json(firma);
    } catch (error) {
      return res.status(500).json({ error: "Nepodařilo se vytvořit firmu" });
    }
  });

  app.patch("/api/firmy/:id", async (req, res) => {
    try {
      const firma = await storage.updateFirma(req.params.id, req.body);
      if (!firma) return res.status(404).json({ error: "Firma nenalezena" });
      return res.json(firma);
    } catch (error) {
      return res.status(500).json({ error: "Nepodařilo se upravit firmu" });
    }
  });

  app.delete("/api/firmy/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFirma(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Firma nenalezena" });
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
      return res.json(await storage.getKontakty(firmaId));
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/kontakty", async (req, res) => {
    try {
      return res.status(201).json(await storage.createKontakt(req.body));
    } catch (error) {
      return res.status(500).json({ error: "Nepodařilo se vytvořit kontakt" });
    }
  });

  app.patch("/api/kontakty/:id", async (req, res) => {
    try {
      const k = await storage.updateKontakt(req.params.id, req.body);
      if (!k) return res.status(404).json({ error: "Kontakt nenalezen" });
      return res.json(k);
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  app.delete("/api/kontakty/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteKontakt(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Kontakt nenalezen" });
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
      return res.json(await storage.getKomunikace(firmaId));
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/komunikace", async (req, res) => {
    try {
      return res.status(201).json(await storage.createKomunikace(req.body));
    } catch (error) {
      return res.status(500).json({ error: "Nepodařilo se přidat záznam" });
    }
  });

  app.delete("/api/komunikace/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteKomunikace(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Záznam nenalezen" });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  // Followupy
  app.get("/api/followupy", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const firmaId = req.query.firmaId as string;
      if (firmaId) return res.json(await storage.getFollowupyByFirma(firmaId));
      if (userId) return res.json(await storage.getFollowupy(userId));
      return res.status(400).json({ error: "userId or firmaId required" });
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/followupy", async (req, res) => {
    try {
      return res.status(201).json(await storage.createFollowup(req.body));
    } catch (error) {
      return res.status(500).json({ error: "Nepodařilo se vytvořit follow-up" });
    }
  });

  app.patch("/api/followupy/:id", async (req, res) => {
    try {
      const f = await storage.updateFollowup(req.params.id, req.body);
      if (!f) return res.status(404).json({ error: "Follow-up nenalezen" });
      return res.json(f);
    } catch (error) {
      return res.status(500).json({ error: "Chyba" });
    }
  });

  app.delete("/api/followupy/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFollowup(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Follow-up nenalezen" });
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
      const firmy = await storage.getFirmy(userId);
      const followupy = await storage.getFollowupy(userId);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      const nesplneneFollowupy = followupy.filter(f => !f.splneno);
      const prosleFU = nesplneneFollowupy.filter(f => new Date(f.datumPlan) < today);
      const dnesFU = nesplneneFollowupy.filter(f => {
        const d = new Date(f.datumPlan);
        return d >= today && d < new Date(today.getTime() + 24*60*60*1000);
      });
      const bliziciFU = nesplneneFollowupy.filter(f => {
        const d = new Date(f.datumPlan);
        return d >= today && d <= in3Days;
      });

      const stavDistribuce = firmy.reduce((acc, f) => {
        acc[f.stav] = (acc[f.stav] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const celkovaHodnota = firmy.reduce((s, f) => s + (f.hodnotaDealu ?? 0), 0);
      const aktivniLeady = firmy.filter(f => !["zakaznik", "nezajem"].includes(f.stav)).length;

      return res.json({
        celkemFirem: firmy.length,
        aktivniLeady,
        celkovaHodnota,
        zakazniku: firmy.filter(f => f.stav === "zakaznik").length,
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

  return httpServer;
}
