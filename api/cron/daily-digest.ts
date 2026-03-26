import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ============================================================
// Config
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL || "https://ajbvjnqpxoqsvlmwpxxu.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnZqbnFweG9xc3ZsbXdweHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDA0NjUsImV4cCI6MjA4ODgxNjQ2NX0.1Fqrj3wb9ezl65Yop7AjGoa9_5N5cMG-AenD9xlV75k";
const supabase = createClient(supabaseUrl, supabaseKey);

// Users who should receive daily digest
const USERS = [
  { id: "4758d5f0-1cc6-4210-9d52-3f65a064291b", email: "petr.hollmann@gmail.com", name: "Petr" },
  { id: "c9044478-67eb-450e-a329-1a5b05f0108d", email: "robin.soudil@kevelyn.cz", name: "Robin" },
];

const CRM_URL = "https://crm-app-umber-eight.vercel.app";

// ============================================================
// Helpers
// ============================================================

function rowToFollowup(r: any) {
  return {
    id: r.id,
    firmaId: r.firma_id,
    userId: r.user_id,
    typ: r.typ,
    popis: r.popis,
    datumPlan: r.datum_plan ? new Date(r.datum_plan) : new Date(),
    splneno: r.splneno,
    priorita: r.priorita,
  };
}

function rowToFirma(r: any) {
  return {
    id: r.id,
    nazev: r.nazev,
  };
}

function formatCzechDate(date: Date): string {
  const months = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince",
  ];
  return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

const FOLLOWUP_TYP_LABELS: Record<string, string> = {
  email: "📧 Email",
  telefon: "📞 Telefon",
  schuzka: "🤝 Schůzka",
  linkedin: "💼 LinkedIn",
  nabidka: "📋 Nabídka",
  uloha: "📌 Úkol",
};

const PRIORITA_EMOJI: Record<string, string> = {
  vysoka: "🔴",
  stredni: "🟡",
  nizka: "⚪",
};

// ============================================================
// Build HTML email
// ============================================================

function buildEmailHtml(
  userName: string,
  dateStr: string,
  prosle: any[],
  dnes: any[],
  blizici: any[],
  firmaMap: Record<string, string>
): string {
  const sections: string[] = [];

  if (prosle.length > 0) {
    const items = prosle.map((f) => {
      const firma = firmaMap[f.firmaId] || "Neznámá firma";
      const daysOverdue = daysBetween(new Date(f.datumPlan), new Date());
      const typ = FOLLOWUP_TYP_LABELS[f.typ] || f.typ;
      const pri = PRIORITA_EMOJI[f.priorita] || "";
      return `<li style="margin-bottom:8px">${pri} <strong>${firma}</strong> — ${typ}: ${f.popis} <span style="color:#dc2626">(${daysOverdue} dní po termínu)</span></li>`;
    }).join("\n");
    sections.push(`
      <h2 style="color:#dc2626;font-size:16px;margin-top:24px">🔴 Prošlé (nesplněné) — ${prosle.length}</h2>
      <ul style="padding-left:20px">${items}</ul>
    `);
  }

  if (dnes.length > 0) {
    const items = dnes.map((f) => {
      const firma = firmaMap[f.firmaId] || "Neznámá firma";
      const typ = FOLLOWUP_TYP_LABELS[f.typ] || f.typ;
      const pri = PRIORITA_EMOJI[f.priorita] || "";
      return `<li style="margin-bottom:8px">${pri} <strong>${firma}</strong> — ${typ}: ${f.popis}</li>`;
    }).join("\n");
    sections.push(`
      <h2 style="color:#2563eb;font-size:16px;margin-top:24px">📋 Dnes — ${dnes.length}</h2>
      <ul style="padding-left:20px">${items}</ul>
    `);
  }

  if (blizici.length > 0) {
    const items = blizici.map((f) => {
      const firma = firmaMap[f.firmaId] || "Neznámá firma";
      const typ = FOLLOWUP_TYP_LABELS[f.typ] || f.typ;
      const d = new Date(f.datumPlan);
      const dateLabel = formatCzechDate(d);
      return `<li style="margin-bottom:8px"><strong>${firma}</strong> — ${typ}: ${f.popis} <span style="color:#6b7280">(${dateLabel})</span></li>`;
    }).join("\n");
    sections.push(`
      <h2 style="color:#f59e0b;font-size:16px;margin-top:24px">📅 Blížící se (další 3 dny) — ${blizici.length}</h2>
      <ul style="padding-left:20px">${items}</ul>
    `);
  }

  if (sections.length === 0) {
    return ""; // No email needed
  }

  return `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:20px">
  <h1 style="font-size:18px;border-bottom:2px solid #e5e7eb;padding-bottom:12px">
    ⚡ LeadFlow: Follow-upy na ${dateStr}
  </h1>
  <p>Ahoj ${userName}, tady je přehled tvých follow-upů:</p>
  ${sections.join("\n")}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:32px">
  <p style="font-size:13px;color:#6b7280">
    <a href="${CRM_URL}" style="color:#2563eb">Otevřít LeadFlow CRM →</a>
  </p>
</body>
</html>
  `.trim();
}

// ============================================================
// Main handler
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (Vercel sets this header for cron invocations)
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  }

  const resend = new Resend(resendKey);
  const results: string[] = [];

  for (const user of USERS) {
    try {
      // Fetch firmy for name mapping
      const { data: firmyData } = await supabase
        .from("firmy")
        .select("id, nazev")
        .eq("user_id", user.id);

      const firmaMap: Record<string, string> = {};
      (firmyData ?? []).forEach((f: any) => {
        firmaMap[f.id] = f.nazev;
      });

      // Fetch unfulfilled follow-ups
      const { data: fuData } = await supabase
        .from("followupy")
        .select("*")
        .eq("user_id", user.id)
        .eq("splneno", false)
        .order("datum_plan", { ascending: true });

      const followupy = (fuData ?? []).map(rowToFollowup);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      const prosle = followupy.filter((f) => new Date(f.datumPlan) < today);
      const dnes = followupy.filter((f) => {
        const d = new Date(f.datumPlan);
        return d >= today && d < tomorrow;
      });
      const blizici = followupy.filter((f) => {
        const d = new Date(f.datumPlan);
        return d >= tomorrow && d <= in3Days;
      });

      // Skip if nothing to report
      if (prosle.length === 0 && dnes.length === 0 && blizici.length === 0) {
        results.push(`${user.name}: žádné follow-upy, email neposlán`);
        continue;
      }

      const dateStr = formatCzechDate(now);
      const html = buildEmailHtml(user.name, dateStr, prosle, dnes, blizici, firmaMap);

      if (!html) {
        results.push(`${user.name}: prázdný obsah, email neposlán`);
        continue;
      }

      const { error } = await resend.emails.send({
        from: "LeadFlow CRM <onboarding@resend.dev>",
        to: [user.email],
        subject: `LeadFlow: Follow-upy na ${dateStr}`,
        html,
      });

      if (error) {
        results.push(`${user.name}: chyba při odesílání — ${error.message}`);
      } else {
        results.push(`${user.name}: email odeslán (prošlé: ${prosle.length}, dnes: ${dnes.length}, blížící se: ${blizici.length})`);
      }
    } catch (err: any) {
      results.push(`${user.name}: výjimka — ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, results });
}
