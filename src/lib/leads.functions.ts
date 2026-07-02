import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: lead }, { data: audits }, { data: messages }] = await Promise.all([
      context.supabase.from("leads").select("*").eq("id", data.id).single(),
      context.supabase
        .from("audits")
        .select("*")
        .eq("lead_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("outreach_messages")
        .select("*")
        .eq("lead_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    return { lead, audits: audits ?? [], messages: messages ?? [] };
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  patch: z.object({
    status: z
      .enum([
        "new",
        "audited",
        "message_ready",
        "sent",
        "replied",
        "interested",
        "meeting",
        "proposal_sent",
        "won",
        "lost",
      ])
      .optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    next_followup_at: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
  }),
});
export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("leads")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since = today.toISOString();
    const [leadsRes, auditsRes, msgsRes, sentRes, repliedRes, interestedRes, fuRes] =
      await Promise.all([
        context.supabase.from("leads").select("id,status,created_at,priority", { count: "exact" }),
        context.supabase.from("audits").select("id,overall_score,created_at"),
        context.supabase.from("outreach_messages").select("id,status,sent_at,created_at"),
        context.supabase
          .from("outreach_messages")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent"),
        context.supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("status", "replied"),
        context.supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .in("status", ["interested", "meeting", "proposal_sent", "won"]),
        context.supabase
          .from("follow_ups")
          .select("id", { count: "exact", head: true })
          .lte("due_at", new Date().toISOString())
          .eq("done", false),
      ]);
    const leads = leadsRes.data ?? [];
    const audits = auditsRes.data ?? [];
    const msgs = msgsRes.data ?? [];
    const todayLeads = leads.filter((l: any) => l.created_at >= since).length;
    const todayAudits = audits.filter((a: any) => a.created_at >= since).length;
    const draftMsgs = msgs.filter((m: any) => m.status === "draft").length;
    const wonCount = leads.filter((l: any) => l.status === "won").length;
    const conversionRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0;
    const avgScore = audits.length
      ? Math.round(
          audits.reduce((s: number, a: any) => s + (a.overall_score ?? 0), 0) / audits.length,
        )
      : 0;
    return {
      totalLeads: leadsRes.count ?? leads.length,
      todayLeads,
      todayAudits,
      draftMsgs,
      sentCount: sentRes.count ?? 0,
      repliedCount: repliedRes.count ?? 0,
      interestedCount: interestedRes.count ?? 0,
      followupsDue: fuRes.count ?? 0,
      conversionRate,
      avgScore,
      revenueEstimate: (interestedRes.count ?? 0) * 2500,
      // chart series: last 14 days
      timeline: buildTimeline(leads, audits, msgs),
      statusBreakdown: groupBy(leads, "status"),
    };
  });

function buildTimeline(
  leads: { created_at: string }[],
  audits: { created_at: string }[],
  msgs: { created_at: string }[],
) {
  const days: { date: string; leads: number; audits: number; messages: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      leads: leads.filter((l) => l.created_at.slice(0, 10) === key).length,
      audits: audits.filter((a) => a.created_at.slice(0, 10) === key).length,
      messages: msgs.filter((m) => m.created_at.slice(0, 10) === key).length,
    });
  }
  return days;
}
function groupBy<T extends { status: string }>(rows: T[], key: "status") {
  const out: Record<string, number> = {};
  rows.forEach((r) => {
    out[r[key]] = (out[r[key]] ?? 0) + 1;
  });
  return out;
}
