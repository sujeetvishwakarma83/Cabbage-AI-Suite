import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway.server";

const Input = z.object({ leadId: z.string().uuid() });

function cleanSocialUrl(url: string | undefined, type: string): string | undefined {
  if (!url) return undefined;

  // Ensure absolute URL first for parser
  let normalized = url.split("?")[0].replace(/\/+$/, "");
  if (normalized.startsWith("//")) {
    normalized = `https:${normalized}`;
  }
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  const lower = normalized.toLowerCase();

  // Ignore sharing/plugin URLs
  if (
    type === "facebook" &&
    (lower.includes("/sharer") || lower.includes("/plugins/") || lower.includes("/dialog/"))
  ) {
    return undefined;
  }
  if (type === "linkedin" && (lower.includes("/share") || lower.includes("/sharing"))) {
    return undefined;
  }
  if (type === "x" && (lower.includes("/intent/") || lower.includes("/share"))) {
    return undefined;
  }
  if (
    type === "instagram" &&
    (lower.includes("/p/") || lower.includes("/tv/") || lower.includes("/reels/"))
  ) {
    return undefined;
  }
  if (type === "youtube" && (lower.includes("/embed/") || lower.includes("/watch"))) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    const pathLower = pathname.toLowerCase();

    // If the path is empty, it's just the homepage (e.g. facebook.com), not a profile
    if (!pathname || pathLower === "" || pathLower === "/" || pathLower === "/index.html") {
      return undefined;
    }

    // Ignore generic root paths on specific networks
    const genericPaths = [
      "/pages",
      "/groups",
      "/share",
      "/sharing",
      "/company",
      "/in",
      "/profile",
      "/c",
      "/user",
      "/channel",
    ];
    if (genericPaths.includes(pathLower)) {
      return undefined;
    }
  } catch (e) {
    return undefined;
  }

  return normalized;
}

function parsePhoneNumber(telOrWhatsapp: string | undefined): string | undefined {
  if (!telOrWhatsapp) return undefined;
  if (telOrWhatsapp.startsWith("tel:")) {
    return telOrWhatsapp.replace("tel:", "").replace(/[^0-9+]/g, "");
  }
  if (telOrWhatsapp.includes("wa.me/")) {
    const parts = telOrWhatsapp.split("wa.me/");
    if (parts[1]) {
      const numPart = parts[1].split("?")[0].replace(/[^0-9]/g, "");
      if (numPart.length >= 7) return numPart;
    }
  }
  if (telOrWhatsapp.includes("phone=")) {
    const match = telOrWhatsapp.match(/phone=([0-9+]+)/);
    if (match && match[1]) {
      return match[1].replace(/[^0-9]/g, "");
    }
  }
  return undefined;
}

const AuditSchema = z.object({
  overall_score: z.number().min(0).max(100),
  summary: z.string(),
  scores: z.object({
    performance: z.number().min(0).max(100),
    mobile: z.number().min(0).max(100),
    design: z.number().min(0).max(100),
    seo: z.number().min(0).max(100),
    trust: z.number().min(0).max(100),
    accessibility: z.number().min(0).max(100),
    branding: z.number().min(0).max(100),
    cta_and_forms: z.number().min(0).max(100),
  }),
  missing_features: z.array(z.string()),
  issues: z.array(
    z.object({
      area: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      detail: z.string(),
    }),
  ),
  suggestions: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      benefit: z.string(),
      priority: z.enum(["low", "medium", "high"]),
      estimated_uplift_pct: z.number().min(0).max(100),
    }),
  ),
  estimated_roi: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  detected_socials: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
      x: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
      whatsapp: z.string().optional(),
    })
    .optional(),
  detected_email: z.string().optional(),
  detected_phone: z.string().optional(),
});

function extractSocials(html: string) {
  const findProfile = (re: RegExp, type: string) => {
    const globalRe = new RegExp(re.source, re.flags + "g");
    const matches = html.match(globalRe);
    if (!matches) return undefined;
    for (const match of matches) {
      const cleaned = cleanSocialUrl(match, type);
      if (cleaned) return cleaned;
    }
    return undefined;
  };

  return {
    facebook: findProfile(/https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9._\-/?=&%+]+/i, "facebook"),
    instagram: findProfile(
      /https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._\-/?=&%+]+/i,
      "instagram",
    ),
    linkedin: findProfile(/https?:\/\/(www\.)?linkedin\.com\/[A-Za-z0-9._\-/?=&%+]+/i, "linkedin"),
    x: findProfile(/https?:\/\/(www\.)?(twitter|x)\.com\/[A-Za-z0-9._\-/?=&%+]+/i, "x"),
    youtube: findProfile(/https?:\/\/(www\.)?youtube\.com\/[A-Za-z0-9._\-/?=&%@+]+/i, "youtube"),
    tiktok: findProfile(/https?:\/\/(www\.)?tiktok\.com\/@?[A-Za-z0-9._\-/?=&%+]+/i, "tiktok"),
    email: (() => {
      const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = html.match(emailRe);
      if (!matches) return undefined;
      for (const m of matches) {
        if (!/\.(png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|css|js)$/i.test(m)) {
          return m;
        }
      }
      return matches[0];
    })(),
    whatsapp: (() => {
      const waRe =
        /https?:\/\/(wa\.me|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send|chat\.whatsapp\.com)\/[A-Za-z0-9._\-/?=&%+]+/gi;
      const matches = html.match(waRe);
      return matches ? matches[0] : undefined;
    })(),
    phone: (() => {
      const telRe = /tel:(\+?[0-9\s\-()]{7,20})/gi;
      const matches = html.match(telRe);
      if (matches) {
        return matches[0];
      }
      const waRe = /wa\.me\/([0-9]+)/i;
      const waMatch = html.match(waRe);
      if (waMatch && waMatch[1]) {
        return `tel:${waMatch[1]}`;
      }
      return undefined;
    })(),
  };
}

function findContactPageUrl(homepageHtml: string, baseUrl: string): string | undefined {
  const re = /href=["']([^"']+)["']/gi;
  const matches = homepageHtml.match(re);
  if (!matches) return undefined;

  let bestLink: string | undefined = undefined;
  for (const m of matches) {
    const rawUrl = m.replace(/href=["']|["']/g, "");
    const lower = rawUrl.toLowerCase();

    if (lower.includes("contact")) {
      bestLink = rawUrl;
      break;
    }
    if (lower.includes("about") && !bestLink) {
      bestLink = rawUrl;
    }
  }

  if (!bestLink) return undefined;

  try {
    const parsedBase = new URL(baseUrl);
    if (bestLink.startsWith("/")) {
      return `${parsedBase.origin}${bestLink}`;
    }
    if (!bestLink.startsWith("http://") && !bestLink.startsWith("https://")) {
      let path = parsedBase.pathname;
      if (!path.endsWith("/")) {
        const lastSlash = path.lastIndexOf("/");
        if (lastSlash !== -1) {
          path = path.slice(0, lastSlash + 1);
        } else {
          path = "/";
        }
      }
      return `${parsedBase.origin}${path}${bestLink}`;
    }
    const parsedBest = new URL(bestLink);
    if (parsedBest.hostname.replace("www.", "") === parsedBase.hostname.replace("www.", "")) {
      return bestLink;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export const runAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: lead, error: lerr } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .single();
    if (lerr || !lead) throw new Error("Lead not found");
    if (!lead.website) throw new Error("Lead has no website to audit");

    let html = "";
    let fetchOk = false;
    const httpsOk = lead.website.startsWith("https://");
    let elapsedMs = 0;
    try {
      const t0 = Date.now();
      const r = await fetch(lead.website, {
        headers: { "User-Agent": "Mozilla/5.0 CabbageCodeAuditor/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      elapsedMs = Date.now() - t0;
      fetchOk = r.ok;
      html = (await r.text()).slice(0, 60000);
    } catch (e) {
      html = `<!-- fetch failed: ${(e as Error).message} -->`;
    }

    let contactHtml = "";
    const contactUrl = findContactPageUrl(html, lead.website);
    if (contactUrl) {
      try {
        const cr = await fetch(contactUrl, {
          headers: { "User-Agent": "Mozilla/5.0 CabbageCodeAuditor/1.0" },
          signal: AbortSignal.timeout(8000),
        });
        if (cr.ok) {
          contactHtml = (await cr.text()).slice(0, 30000);
        }
      } catch (e) {
        console.error("Failed to fetch contact page:", e);
      }
    }

    const combinedHtml = html + "\n" + contactHtml;
    const socials = extractSocials(combinedHtml);

    const excerpt = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/\s+/g, " ")
      .slice(0, 10000);

    const contactExcerpt = contactHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/\s+/g, " ")
      .slice(0, 4000);

    const finalExcerptForAi =
      excerpt + (contactExcerpt ? "\nCONTACT PAGE EXCERPT:\n" + contactExcerpt : "");

    const model = getAiModel() as any;

    const prompt = `You audit small-business websites for a web design agency.
Business: ${lead.business_name} (${lead.category ?? "n/a"}) in ${[lead.city, lead.country].filter(Boolean).join(", ") || "unknown"}.
Website: ${lead.website}
Fetch status: ok=${fetchOk}, https=${httpsOk}, response_time_ms=${elapsedMs}.

Analyze the HTML excerpt below and return a structured audit.
You MUST carefully check for and report if the website has:
1. Slow loading speed (evaluate based on HTML structure and the response time: ${elapsedMs}ms).
2. No WhatsApp button or Chat option.
3. Weak SEO (check for missing meta description, H1 tags, or structured schema markup).
4. No AI Chatbot or Live Chat.
5. Poor or missing CTAs (Call to Actions like "Book Now", "Contact Us", etc.).
6. Missing or poorly designed Contact Form.
7. Missing or invalid Social Media Profile links (if generic homepages are used or links are missing).

Include these findings in the 'issues', 'missing_features', and 'suggestions' list with priority scoring. 
Each category score (performance, mobile, design, seo, trust, accessibility, branding, cta_and_forms) must range between 0-100. Overall score is the weighted average.
Generate 5-8 prioritized improvement suggestions with concrete business benefits.
Estimate ROI as a short phrase (e.g. "+25% leads in 90 days").

Specifically, look for the business's official social media profile URLs (Facebook, Instagram, LinkedIn, X/Twitter, YouTube, TikTok, WhatsApp) and contact details (email, phone number) in the HTML, and return them in detected_socials, detected_email, and detected_phone. Ensure they are full, valid absolute URLs (except for email and phone).

HTML EXCERPT:
${finalExcerptForAi}`;

    let parsed: z.infer<typeof AuditSchema>;
    try {
      const result = await generateText({
        model,
        prompt,
        output: Output.object({ schema: AuditSchema }),
      });
      parsed = result.output as z.infer<typeof AuditSchema>;
    } catch (e) {
      throw new Error(`AI audit failed: ${(e as Error).message}`);
    }

    // Merge detected socials
    const detSoc = parsed.detected_socials ?? {};
    const cleanProfile = (url: string | null | undefined, type: string): string | null => {
      const cleaned = cleanSocialUrl(url ?? undefined, type);
      return cleaned || null;
    };

    const finalSoc = {
      social_facebook: cleanProfile(detSoc.facebook, "facebook") ?? socials.facebook ?? null,
      social_instagram: cleanProfile(detSoc.instagram, "instagram") ?? socials.instagram ?? null,
      social_linkedin: cleanProfile(detSoc.linkedin, "linkedin") ?? socials.linkedin ?? null,
      social_x: cleanProfile(detSoc.x, "x") ?? socials.x ?? null,
      social_youtube: cleanProfile(detSoc.youtube, "youtube") ?? socials.youtube ?? null,
      social_tiktok: cleanProfile(detSoc.tiktok, "tiktok") ?? socials.tiktok ?? null,
    };

    const extractedPhone =
      parsePhoneNumber(socials.phone) ??
      parsePhoneNumber(socials.whatsapp) ??
      parsePhoneNumber(detSoc.whatsapp) ??
      parsed.detected_phone ??
      null;

    const { data: audit, error: aerr } = await context.supabase
      .from("audits")
      .insert({
        lead_id: lead.id,
        owner_id: context.userId,
        overall_score: parsed.overall_score,
        summary: parsed.summary,
        scores: parsed.scores,
        issues: parsed.issues,
        suggestions: parsed.suggestions,
        missing_features: parsed.missing_features,
        estimated_roi: parsed.estimated_roi,
        priority: parsed.priority,
        raw_html_excerpt: excerpt.slice(0, 4000),
      })
      .select("*")
      .single();
    if (aerr) throw new Error(aerr.message);

    const currentEmail = lead.email && lead.email.trim() !== "" ? lead.email : null;
    const currentPhone = lead.phone && lead.phone.trim() !== "" ? lead.phone : null;

    const detectedEmail = parsed.detected_email ?? socials.email ?? null;
    const finalEmail = detectedEmail && detectedEmail.trim() !== "" ? detectedEmail : currentEmail;
    const finalPhone = extractedPhone ?? currentPhone ?? null;

    await context.supabase
      .from("leads")
      .update({
        status: "audited",
        priority: parsed.priority,
        email: finalEmail,
        phone: finalPhone,
        ...finalSoc,
      })
      .eq("id", lead.id);

    return audit;
  });
