import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ---- Auth / User routes ----
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, fullName, email, company, role } = req.body;
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: "Username already exists" });
      }
      const user = await storage.createUser({ username, password, fullName, email, company, role });
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ---- Lead routes ----
  app.get("/api/leads", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const search = req.query.search as string;
      let leads;
      if (search) {
        leads = await storage.searchLeads(userId, search);
      } else {
        leads = await storage.getLeads(userId);
      }
      return res.json(leads);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      return res.json(lead);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const lead = await storage.createLead(req.body);
      return res.status(201).json(lead);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      return res.json(lead);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Lead not found" });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // ---- Activity routes ----
  app.get("/api/activities", async (req, res) => {
    try {
      const leadId = req.query.leadId as string;
      const userId = req.query.userId as string;
      if (leadId) {
        const activities = await storage.getActivities(leadId);
        return res.json(activities);
      } else if (userId) {
        const activities = await storage.getActivitiesByUser(userId);
        return res.json(activities);
      }
      return res.status(400).json({ error: "leadId or userId is required" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activity = await storage.createActivity(req.body);
      return res.status(201).json(activity);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const activity = await storage.updateActivity(req.params.id, req.body);
      if (!activity) return res.status(404).json({ error: "Activity not found" });
      return res.json(activity);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteActivity(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Activity not found" });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // ---- Dashboard stats ----
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const leads = await storage.getLeads(userId);
      const activities = await storage.getActivitiesByUser(userId);

      const totalLeads = leads.length;
      const totalValue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);
      const wonLeads = leads.filter(l => l.stage === "won");
      const wonValue = wonLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
      const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads * 100).toFixed(1) : "0";

      const stageDistribution = leads.reduce((acc, l) => {
        acc[l.stage] = (acc[l.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sourceDistribution = leads.reduce((acc, l) => {
        acc[l.source] = (acc[l.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pendingTasks = activities.filter(a => !a.completed && a.type === "task").length;
      const upcomingMeetings = activities.filter(a => !a.completed && a.type === "meeting").length;

      return res.json({
        totalLeads,
        totalValue,
        wonValue,
        conversionRate: parseFloat(conversionRate as string),
        stageDistribution,
        sourceDistribution,
        pendingTasks,
        upcomingMeetings,
        recentLeads: leads.slice(0, 5),
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
