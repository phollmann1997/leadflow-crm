import {
  type User, type InsertUser,
  type Lead, type InsertLead,
  type Activity, type InsertActivity,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Leads
  getLeads(userId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  searchLeads(userId: string, query: string): Promise<Lead[]>;

  // Activities
  getActivities(leadId: string): Promise<Activity[]>;
  getActivitiesByUser(userId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leads: Map<string, Lead>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.activities = new Map();
    this.seedData();
  }

  private seedData() {
    // Create a demo user
    const demoUser: User = {
      id: "demo-user-1",
      username: "demo",
      password: "demo123",
      fullName: "Petr Hollmann",
      email: "petr@example.com",
      company: "MyCRM",
      role: "Sales Manager",
    };
    this.users.set(demoUser.id, demoUser);

    // Seed some leads
    const seedLeads: Lead[] = [
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Jan",
        lastName: "Novak",
        email: "jan.novak@firma.cz",
        phone: "+420 602 123 456",
        company: "TechStart s.r.o.",
        position: "CEO",
        source: "website",
        stage: "new",
        priority: "high",
        value: 150000,
        notes: "Interested in enterprise plan",
        tags: "enterprise,tech",
        createdAt: new Date("2026-03-01"),
        lastContactedAt: null,
      },
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Eva",
        lastName: "Svobodova",
        email: "eva@designstudio.cz",
        phone: "+420 603 234 567",
        company: "Design Studio Praha",
        position: "Marketing Director",
        source: "referral",
        stage: "contacted",
        priority: "medium",
        value: 85000,
        notes: "Referred by Jan Novak",
        tags: "design,marketing",
        createdAt: new Date("2026-03-03"),
        lastContactedAt: new Date("2026-03-05"),
      },
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Martin",
        lastName: "Kral",
        email: "m.kral@bigcorp.cz",
        phone: "+420 604 345 678",
        company: "BigCorp a.s.",
        position: "CTO",
        source: "cold_call",
        stage: "qualified",
        priority: "high",
        value: 320000,
        notes: "Looking for CRM integration with their ERP",
        tags: "enterprise,integration",
        createdAt: new Date("2026-02-20"),
        lastContactedAt: new Date("2026-03-08"),
      },
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Lucie",
        lastName: "Horakova",
        email: "lucie@startup.io",
        phone: "+420 605 456 789",
        company: "InnoStart",
        position: "Founder",
        source: "event",
        stage: "proposal",
        priority: "medium",
        value: 55000,
        notes: "Met at Prague Startup Summit",
        tags: "startup,saas",
        createdAt: new Date("2026-02-15"),
        lastContactedAt: new Date("2026-03-10"),
      },
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Tomas",
        lastName: "Dvorak",
        email: "tomas@ecommerce.cz",
        phone: "+420 606 567 890",
        company: "ShopMax",
        position: "Head of Sales",
        source: "email_campaign",
        stage: "negotiation",
        priority: "high",
        value: 210000,
        notes: "Negotiating annual contract",
        tags: "ecommerce,retail",
        createdAt: new Date("2026-01-28"),
        lastContactedAt: new Date("2026-03-09"),
      },
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Petra",
        lastName: "Malikova",
        email: "petra@agency.cz",
        phone: "+420 607 678 901",
        company: "Digital Agency XY",
        position: "Account Manager",
        source: "social_media",
        stage: "won",
        priority: "low",
        value: 42000,
        notes: "Signed 6-month contract",
        tags: "agency,digital",
        createdAt: new Date("2026-01-10"),
        lastContactedAt: new Date("2026-03-01"),
      },
      {
        id: randomUUID(),
        userId: "demo-user-1",
        firstName: "Karel",
        lastName: "Cerny",
        email: "karel@oldschool.cz",
        phone: "+420 608 789 012",
        company: "Traditional Corp",
        position: "Manager",
        source: "cold_call",
        stage: "lost",
        priority: "low",
        value: 30000,
        notes: "Went with competitor, budget constraints",
        tags: "traditional",
        createdAt: new Date("2026-02-01"),
        lastContactedAt: new Date("2026-02-28"),
      },
    ];

    for (const lead of seedLeads) {
      this.leads.set(lead.id, lead);
    }

    // Seed some activities
    const leadIds = seedLeads.map(l => l.id);
    const seedActivities: Activity[] = [
      {
        id: randomUUID(),
        leadId: leadIds[0],
        userId: "demo-user-1",
        type: "email",
        title: "Sent intro email",
        description: "Sent initial contact email with product overview",
        completed: true,
        dueDate: null,
        createdAt: new Date("2026-03-02"),
      },
      {
        id: randomUUID(),
        leadId: leadIds[1],
        userId: "demo-user-1",
        type: "call",
        title: "Discovery call",
        description: "30min call to understand requirements",
        completed: true,
        dueDate: null,
        createdAt: new Date("2026-03-05"),
      },
      {
        id: randomUUID(),
        leadId: leadIds[2],
        userId: "demo-user-1",
        type: "meeting",
        title: "Product demo scheduled",
        description: "Demo of CRM integration capabilities",
        completed: false,
        dueDate: new Date("2026-03-15"),
        createdAt: new Date("2026-03-08"),
      },
      {
        id: randomUUID(),
        leadId: leadIds[3],
        userId: "demo-user-1",
        type: "note",
        title: "Proposal sent",
        description: "Sent pricing proposal for starter package",
        completed: true,
        dueDate: null,
        createdAt: new Date("2026-03-10"),
      },
      {
        id: randomUUID(),
        leadId: leadIds[4],
        userId: "demo-user-1",
        type: "task",
        title: "Follow up on contract terms",
        description: "Review their proposed changes to the contract",
        completed: false,
        dueDate: new Date("2026-03-12"),
        createdAt: new Date("2026-03-09"),
      },
    ];

    for (const activity of seedActivities) {
      this.activities.set(activity.id, activity);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, ...insertUser, company: insertUser.company ?? null, role: insertUser.role ?? null };
    this.users.set(id, user);
    return user;
  }

  // Leads
  async getLeads(userId: string): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter((lead) => lead.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      id,
      userId: insertLead.userId,
      firstName: insertLead.firstName,
      lastName: insertLead.lastName,
      email: insertLead.email ?? null,
      phone: insertLead.phone ?? null,
      company: insertLead.company ?? null,
      position: insertLead.position ?? null,
      source: insertLead.source ?? "other",
      stage: insertLead.stage ?? "new",
      priority: insertLead.priority ?? "medium",
      value: insertLead.value ?? 0,
      notes: insertLead.notes ?? null,
      tags: insertLead.tags ?? null,
      createdAt: new Date(),
      lastContactedAt: insertLead.lastContactedAt ?? null,
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    const updated = { ...lead, ...updates };
    this.leads.set(id, updated as Lead);
    return updated as Lead;
  }

  async deleteLead(id: string): Promise<boolean> {
    // Also delete related activities
    const activitiesToDelete = Array.from(this.activities.values())
      .filter(a => a.leadId === id);
    for (const a of activitiesToDelete) {
      this.activities.delete(a.id);
    }
    return this.leads.delete(id);
  }

  async searchLeads(userId: string, query: string): Promise<Lead[]> {
    const q = query.toLowerCase();
    return Array.from(this.leads.values())
      .filter((lead) => {
        if (lead.userId !== userId) return false;
        return (
          lead.firstName.toLowerCase().includes(q) ||
          lead.lastName.toLowerCase().includes(q) ||
          (lead.email?.toLowerCase().includes(q) ?? false) ||
          (lead.company?.toLowerCase().includes(q) ?? false) ||
          (lead.phone?.includes(q) ?? false) ||
          (lead.tags?.toLowerCase().includes(q) ?? false)
        );
      });
  }

  // Activities
  async getActivities(leadId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      leadId: insertActivity.leadId,
      userId: insertActivity.userId,
      type: insertActivity.type,
      title: insertActivity.title,
      description: insertActivity.description ?? null,
      completed: insertActivity.completed ?? false,
      dueDate: insertActivity.dueDate ?? null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    const updated = { ...activity, ...updates };
    this.activities.set(id, updated as Activity);
    return updated as Activity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }
}

export const storage = new MemStorage();
