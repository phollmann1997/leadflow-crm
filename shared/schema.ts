import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Pipeline stages for outreach
export const PIPELINE_STAGES = [
  "novy",           // Nový - ještě neosloven
  "osloven",        // Oslovený - poslán první email/zpráva
  "odpovezel",      // Odpověděl - reagoval (pozitivně/negativně)
  "schuzka",        // Schůzka - domluvená/proběhlá schůzka
  "nabidka",        // Nabídka - odeslána cenová nabídka
  "vyjednavani",    // Vyjednávání - probíhá
  "zakaznik",       // Zákazník - úspěšně uzavřeno
  "nezajem",        // Nezájem - odmítl / nezájem
] as const;

export const PIPELINE_LABELS: Record<string, string> = {
  novy: "Nový",
  osloven: "Oslovený",
  odpovezel: "Odpověděl",
  schuzka: "Schůzka",
  nabidka: "Nabídka",
  vyjednavani: "Vyjednávání",
  zakaznik: "Zákazník",
  nezajem: "Nezájem",
};

export const PIPELINE_COLORS: Record<string, string> = {
  novy: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  osloven: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  odpovezel: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  schuzka: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  nabidka: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  vyjednavani: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  zakaznik: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  nezajem: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const KANBAN_DOT_COLORS: Record<string, string> = {
  novy: "bg-slate-500",
  osloven: "bg-blue-500",
  odpovezel: "bg-yellow-500",
  schuzka: "bg-purple-500",
  nabidka: "bg-indigo-500",
  vyjednavani: "bg-orange-500",
  zakaznik: "bg-green-500",
  nezajem: "bg-red-500",
};

export const OBORY = [
  "faktoring",
  "ucetnictvi",
  "logistika",
  "pojistovnictvi",
  "makler",
  "nakupni_agentura",
  "financni_sluzby",
  "pravni_sluzby",
  "jine",
] as const;

export const OBOR_LABELS: Record<string, string> = {
  faktoring: "Faktoring",
  ucetnictvi: "Účetnictví",
  logistika: "Logistika",
  pojistovnictvi: "Pojišťovnictví",
  makler: "Makléř / Broker",
  nakupni_agentura: "Nákupní agentura",
  financni_sluzby: "Finanční služby",
  pravni_sluzby: "Právní služby",
  jine: "Jiné",
};

export const ZDROJE = [
  "web",
  "linkedin",
  "doporuceni",
  "cold_email",
  "cold_call",
  "akce",
  "ares",
  "jine",
] as const;

export const ZDROJ_LABELS: Record<string, string> = {
  web: "Web",
  linkedin: "LinkedIn",
  doporuceni: "Doporučení",
  cold_email: "Cold email",
  cold_call: "Cold call",
  akce: "Akce / Event",
  ares: "ARES / Rejstřík",
  jine: "Jiné",
};

// Firmy (companies/leads)
export const firmy = pgTable("firmy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nazev: text("nazev").notNull(),           // Název firmy
  ico: text("ico"),                          // IČO
  web: text("web"),                          // Web firmy
  obor: text("obor").notNull().default("jine"),
  pocetZamestnancu: text("pocet_zamestnancu"), // odhad
  ppisPodnikani: text("popis_podnikani"),    // co dělají
  adresa: text("adresa"),
  poznamky: text("poznamky"),                // interní poznámky
  zdroj: text("zdroj").notNull().default("jine"),
  stav: text("stav").notNull().default("novy"), // pipeline stage
  hodnotaDealu: integer("hodnota_dealu").default(0), // CZK odhad
  tagy: text("tagy"),                        // tagy oddělené čárkou
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFirmaSchema = createInsertSchema(firmy).omit({
  id: true,
  createdAt: true,
});

export type InsertFirma = z.infer<typeof insertFirmaSchema>;
export type Firma = typeof firmy.$inferSelect;

// Kontakty (contact persons at companies)
export const kontakty = pgTable("kontakty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmaId: varchar("firma_id").notNull(),
  jmeno: text("jmeno").notNull(),
  prijmeni: text("prijmeni").notNull(),
  pozice: text("pozice"),                    // CEO, jednatel, office manager...
  email: text("email"),
  telefon: text("telefon"),
  linkedin: text("linkedin"),
  jePrimarni: boolean("je_primarni").default(true), // hlavní kontaktní osoba
  poznamky: text("poznamky"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKontaktSchema = createInsertSchema(kontakty).omit({
  id: true,
  createdAt: true,
});

export type InsertKontakt = z.infer<typeof insertKontaktSchema>;
export type Kontakt = typeof kontakty.$inferSelect;

// Komunikace (communication log)
export const komunikace = pgTable("komunikace", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmaId: varchar("firma_id").notNull(),
  kontaktId: varchar("kontakt_id"),          // optional link to contact
  userId: varchar("user_id").notNull(),
  projektId: varchar("projekt_id"),
  typ: text("typ").notNull(),                // email, telefon, linkedin, schuzka, poznamka
  smer: text("smer").notNull().default("odchozi"), // odchozi / prichozi
  predmet: text("predmet").notNull(),        // subject/title
  obsah: text("obsah"),                      // content/details
  odpoved: text("odpoved"),                  // their response (if any)
  datum: timestamp("datum").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKomunikaceSchema = createInsertSchema(komunikace).omit({
  id: true,
  createdAt: true,
});

export type InsertKomunikace = z.infer<typeof insertKomunikaceSchema>;
export type Komunikace = typeof komunikace.$inferSelect;

export const KOMUNIKACE_TYPY = [
  { value: "email", label: "Email" },
  { value: "telefon", label: "Telefon" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "schuzka", label: "Schůzka" },
  { value: "wa", label: "WhatsApp" },
  { value: "poznamka", label: "Poznámka" },
] as const;

export const SMER_OPTIONS = [
  { value: "odchozi", label: "Odchozí (já jim)" },
  { value: "prichozi", label: "Příchozí (oni mně)" },
] as const;

// Projekty (projects/deals per firma)
export const projekty = pgTable("projekty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmaId: varchar("firma_id").notNull(),
  userId: varchar("user_id").notNull(),
  nazev: text("nazev").notNull(),
  popis: text("popis"),
  stav: text("stav").notNull().default("novy"),
  hodnotaDealu: integer("hodnota_dealu").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjektSchema = createInsertSchema(projekty).omit({
  id: true,
  createdAt: true,
});

export type InsertProjekt = z.infer<typeof insertProjektSchema>;
export type Projekt = typeof projekty.$inferSelect;

// Follow-upy (planned next steps / reminders)
export const followupy = pgTable("followupy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmaId: varchar("firma_id").notNull(),
  userId: varchar("user_id").notNull(),
  projektId: varchar("projekt_id"),
  typ: text("typ").notNull(),                // email, telefon, schuzka, uloha
  popis: text("popis").notNull(),            // co udělat
  datumPlan: timestamp("datum_plan").notNull(), // kdy to udělat
  splneno: boolean("splneno").default(false),
  splnenoDate: timestamp("splneno_date"),
  priorita: text("priorita").notNull().default("stredni"), // nizka, stredni, vysoka
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFollowupSchema = createInsertSchema(followupy).omit({
  id: true,
  createdAt: true,
  splnenoDate: true,
});

export type InsertFollowup = z.infer<typeof insertFollowupSchema>;
export type Followup = typeof followupy.$inferSelect;

export const FOLLOWUP_TYPY = [
  { value: "email", label: "Poslat email" },
  { value: "telefon", label: "Zavolat" },
  { value: "schuzka", label: "Schůzka" },
  { value: "linkedin", label: "LinkedIn zpráva" },
  { value: "nabidka", label: "Poslat nabídku" },
  { value: "uloha", label: "Jiný úkol" },
] as const;

export const PRIORITA_OPTIONS = [
  { value: "nizka", label: "Nízká" },
  { value: "stredni", label: "Střední" },
  { value: "vysoka", label: "Vysoká" },
] as const;

export const PRIORITA_COLORS: Record<string, string> = {
  nizka: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  stredni: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  vysoka: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};
