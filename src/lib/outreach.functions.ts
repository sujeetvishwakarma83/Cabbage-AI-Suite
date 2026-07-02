import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway.server";

const Input = z.object({
  leadId: z.string().uuid(),
  channel: z
    .enum(["email", "linkedin", "facebook", "instagram", "x", "contact_form"])
    .default("email"),
  kind: z
    .enum(["initial", "short", "long", "followup_1", "followup_2", "final"])
    .default("initial"),
  tone: z.enum(["professional", "friendly", "premium", "consultative"]).default("professional"),
});

const Schema = z.object({
  subject: z.string(),
  body: z.string(),
});

const LIMITS: Record<string, number> = {
  email: 2000,
  linkedin: 1900,
  facebook: 900,
  instagram: 900,
  x: 280,
  contact_form: 1500,
};

export const generateOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: lead } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .single();
    if (!lead) throw new Error("Lead not found");
    const { data: latestAudit } = await context.supabase
      .from("audits")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name,company,signature")
      .eq("id", context.userId)
      .single();

    const limit = LIMITS[data.channel] ?? 2000;

    const sysPrompt = `You write personalized B2B outreach for a web design & development agency.
Tone: ${data.tone}. Channel: ${data.channel}. Kind: ${data.kind}.
HARD RULE: total body must be under ${limit} characters. NO spam patterns, NO "I noticed your website is outdated" cliches.
Each message is unique. Include: warm opener, genuine compliment, 2 specific observations, 1 concrete suggestion, business benefit, soft CTA, signature.
IMPORTANT: Clearly explain to the client how we can automate their work/business processes (for example, by automating bookings, contact form leads, customer reviews collection, or live chat support, customized to their industry/needs) to improve efficiency.
${data.channel === "x" ? "Twitter/X: max 280 chars total, no subject line." : ""}
${data.kind.startsWith("followup") || data.kind === "final" ? "This is a follow-up; reference the earlier outreach without being pushy." : ""}`;

    const ctx = `BUSINESS: ${lead.business_name}
INDUSTRY: ${lead.category ?? "Local business"}
LOCATION: ${[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}
WEBSITE: ${lead.website ?? "no website"}
RATING: ${lead.rating ?? "?"} (${lead.reviews_count ?? 0} reviews)
${
  latestAudit
    ? `AUDIT SCORE: ${latestAudit.overall_score}/100
TOP ISSUES: ${JSON.stringify((latestAudit.issues as unknown[])?.slice(0, 4) ?? [])}
KEY SUGGESTIONS: ${JSON.stringify((latestAudit.suggestions as unknown[])?.slice(0, 3) ?? [])}
ESTIMATED IMPACT: ${latestAudit.estimated_roi ?? "n/a"}`
    : "NO AUDIT YET — keep observations general but professional."
}

SENDER: ${profile?.full_name ?? "Your friendly designer"} (${profile?.company ?? "CabbageCode"})
SIGNATURE: ${profile?.signature ?? `${profile?.full_name ?? ""}\n${profile?.company ?? "CabbageCode"}`}`;

    const model = getAiModel() as any;

    const { output: out } = await generateText({
      model,
      prompt: `${sysPrompt}\n\n${ctx}\n\nReturn JSON with "subject" and "body".`,
      output: Output.object({ schema: Schema }),
    });

    const msg = out as z.infer<typeof Schema>;
    const body = msg.body.slice(0, limit);
    const subject = data.channel === "email" ? msg.subject.slice(0, 120) : null;

    const { data: saved, error } = await context.supabase
      .from("outreach_messages")
      .insert({
        lead_id: lead.id,
        owner_id: context.userId,
        channel: data.channel,
        kind: data.kind,
        tone: data.tone,
        subject,
        body,
        status: "draft",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("leads").update({ status: "message_ready" }).eq("id", lead.id);
    return saved;
  });
