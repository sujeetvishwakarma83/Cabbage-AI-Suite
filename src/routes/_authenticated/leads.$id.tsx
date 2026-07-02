import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLead, updateLead } from "@/lib/leads.functions";
import { runAudit } from "@/lib/audit.functions";
import { generateOutreach } from "@/lib/outreach.functions";
import { sendOutreachEmail } from "@/lib/email.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/ScoreRing";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Send,
  Sparkles,
  Star,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Loader2,
  Twitter,
  MessageCircle,
  Copy,
  CheckCircle2,
  Check,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

function getSocialDmLink(
  channel: string,
  url: string | null | undefined,
  phone?: string | null,
): string {
  if (!url && channel !== "whatsapp") return "";

  if (channel === "whatsapp" && phone) {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    const number = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
    return `https://wa.me/${number}`;
  }

  if (!url) return "";

  const cleaned = url.split("?")[0].replace(/\/+$/, "");

  try {
    const parsedUrl = new URL(cleaned);
    const pathname = parsedUrl.pathname;
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length > 0) {
      const username = parts[parts.length - 1];

      if (username && username !== "profile.php") {
        if (channel === "facebook") {
          return `https://m.me/${username}`;
        }
        if (channel === "instagram") {
          return `https://ig.me/m/${username}`;
        }
        if (channel === "x" || channel === "twitter") {
          return `https://x.com/messages/compose?recipient_id=&text=&recipient_screen_name=${username}`;
        }
      }
    }
  } catch (e) {
    if (channel === "facebook") {
      const match = cleaned.match(/facebook\.com\/([A-Za-z0-9._-]+)/i);
      if (match && match[1] !== "profile.php") return `https://m.me/${match[1]}`;
    }
    if (channel === "instagram") {
      const match = cleaned.match(/instagram\.com\/([A-Za-z0-9._-]+)/i);
      if (match) return `https://ig.me/m/${match[1]}`;
    }
  }

  return url;
}

function isValidProfileUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const path = parsed.pathname.replace(/\/+$/, "");
    if (!path || path === "" || path === "/" || path === "/index.html") return false;

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
    if (genericPaths.includes(path.toLowerCase())) return false;

    return true;
  } catch {
    return false;
  }
}

function AuditProgressScanner({ website }: { website: string }) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStep(2), 2500);
    const t2 = setTimeout(() => setCurrentStep(3), 5500);
    const t3 = setTimeout(() => setCurrentStep(4), 8500);
    const t4 = setTimeout(() => setCurrentStep(5), 11500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const steps = [
    { id: 1, label: "Loading website HTML source code" },
    { id: 2, label: "Extracting contact info, emails, & social profiles" },
    { id: 3, label: "Assessing SEO structure, performance, & mobile layout" },
    { id: 4, label: "Evaluating CTAs, Forms, and security parameters" },
    { id: 5, label: "Generating detailed feedback and ROI report" },
  ];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 animate-in fade-in-50 duration-300 relative overflow-hidden my-4">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(120px); opacity: 0; }
        }
      `}</style>
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 animate-[scan_2s_ease-in-out_infinite]" />

      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Auditing: <span className="text-primary hover:underline">{website}</span>
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {steps.map((s) => {
          const isDone = currentStep > s.id;
          const isActive = currentStep === s.id;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 transition-all duration-300 ${
                isDone
                  ? "text-success font-medium"
                  : isActive
                    ? "text-primary font-semibold translate-x-1"
                    : "text-muted-foreground opacity-50"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-border flex items-center justify-center text-[9px] font-semibold">
                  {s.id}
                </div>
              )}
              <span>{s.label}...</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "Lead detail — CabbageCode" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchLead = useServerFn(getLead);
  const audit = useServerFn(runAudit);
  const draft = useServerFn(generateOutreach);
  const send = useServerFn(sendOutreachEmail);
  const update = useServerFn(updateLead);

  const { data, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLead({ data: { id } }),
  });

  const auditMut = useMutation({
    mutationFn: () => audit({ data: { leadId: id } }),
    onSuccess: () => {
      toast.success("AI audit complete");
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [channel, setChannel] = useState<
    "email" | "linkedin" | "facebook" | "instagram" | "x" | "contact_form"
  >("email");
  const [tone, setTone] = useState<"professional" | "friendly" | "premium" | "consultative">(
    "professional",
  );
  const [kind, setKind] = useState<
    "initial" | "short" | "long" | "followup_1" | "followup_2" | "final"
  >("initial");

  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const handleCopyDraft = (text: string, channelName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelName);
    toast.success(`Copied ${channelName} message draft!`);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  const draftMut = useMutation({
    mutationFn: () => draft({ data: { leadId: id, channel, tone, kind } }),
    onSuccess: () => {
      toast.success("Draft generated");
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sendMut = useMutation({
    mutationFn: (messageId: string) => send({ data: { messageId } }),
    onSuccess: () => {
      toast.success("Email sent");
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data?.lead) return <div className="text-muted-foreground">Loading…</div>;
  const lead = data.lead;
  const latestAudit = data.audits[0];

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        to="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <div className="glass-strong rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{lead.business_name}</h1>
              <LeadStatusBadge status={lead.status} />
              {lead.rating != null && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {lead.rating} ({lead.reviews_count ?? 0})
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {[lead.category, lead.address].filter(Boolean).join(" · ")}
            </div>
            <div className="flex flex-wrap gap-3 text-sm pt-1">
              {lead.website && (
                <a
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {lead.website.replace(/^https?:\/\//, "").slice(0, 40)}
                </a>
              )}
              {lead.email && (
                <a
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={`mailto:${lead.email}`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={`tel:${lead.phone}`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {lead.phone}
                </a>
              )}
              {lead.google_maps_url && (
                <a
                  className="inline-flex items-center gap-1 hover:underline"
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Google Maps
                </a>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              {isValidProfileUrl(lead.social_facebook) && (
                <a
                  href={lead.social_facebook!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {isValidProfileUrl(lead.social_instagram) && (
                <a
                  href={lead.social_instagram!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {isValidProfileUrl(lead.social_linkedin) && (
                <a
                  href={lead.social_linkedin!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {isValidProfileUrl(lead.social_youtube) && (
                <a
                  href={lead.social_youtube!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          {latestAudit?.overall_score != null && (
            <ScoreRing score={latestAudit.overall_score} size={120} label="Site score" />
          )}
        </div>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">AI Audit</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="crm">CRM & notes</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">AI Website Audit</h3>
                <p className="text-xs text-muted-foreground">
                  Speed, mobile, SEO, trust, missing features — all scored.
                </p>
              </div>
              <Button
                onClick={() => auditMut.mutate()}
                disabled={auditMut.isPending || !lead.website}
                className="gap-2"
              >
                {auditMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {latestAudit ? "Re-run audit" : "Run audit"}
              </Button>
            </div>
            {!lead.website && (
              <p className="text-sm text-warning">This lead has no website to audit.</p>
            )}
            {auditMut.isPending && <AuditProgressScanner website={lead.website!} />}
            {latestAudit && !auditMut.isPending && (
              <div className="space-y-4">
                <p className="text-sm">{latestAudit.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries((latestAudit.scores ?? {}) as Record<string, number>).map(
                    ([k, v]) => (
                      <div key={k} className="rounded-xl border border-border/60 p-3 text-center">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          {k.replace(/_/g, " ")}
                        </div>
                        <div className="text-2xl font-bold mt-1">{v}</div>
                      </div>
                    ),
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Top issues</h4>
                    <ul className="space-y-2">
                      {(
                        (latestAudit.issues ?? []) as {
                          area: string;
                          severity: string;
                          detail: string;
                        }[]
                      ).map((i, idx) => (
                        <li key={idx} className="rounded-lg border border-border/60 p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{i.area}</span>
                            <span
                              className={`text-xs ${i.severity === "high" ? "text-destructive" : i.severity === "medium" ? "text-warning" : "text-muted-foreground"}`}
                            >
                              {i.severity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{i.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm">
                      Suggestions ({latestAudit.estimated_roi})
                    </h4>
                    <ul className="space-y-2">
                      {(
                        (latestAudit.suggestions ?? []) as {
                          title: string;
                          why: string;
                          benefit: string;
                          priority: string;
                          estimated_uplift_pct: number;
                        }[]
                      ).map((s, idx) => (
                        <li key={idx} className="rounded-lg border border-border/60 p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{s.title}</span>
                            <span className="text-xs text-success">+{s.estimated_uplift_pct}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{s.benefit}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {latestAudit.missing_features && latestAudit.missing_features.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Missing features</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {latestAudit.missing_features.map((f: string) => (
                        <span
                          key={f}
                          className="text-xs rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected Social Channels & Quick DM Widget */}
                <div className="mt-6 pt-6 border-t border-border/40 space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Detected Social Channels & Quick Messaging
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Interact with the lead on social media or direct chat platforms.
                    </p>
                  </div>

                  {(() => {
                    const socialConfigs = [
                      {
                        key: "facebook",
                        name: "Facebook",
                        icon: Facebook,
                        color:
                          "bg-blue-600/10 text-blue-600 border-blue-600/20 hover:bg-blue-600 hover:text-white",
                        btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
                        url: lead.social_facebook,
                        dmUrl: getSocialDmLink("facebook", lead.social_facebook),
                        dmLabel: "Open Messenger",
                      },
                      {
                        key: "instagram",
                        name: "Instagram",
                        icon: Instagram,
                        color:
                          "bg-pink-600/10 text-pink-600 border-pink-600/20 hover:bg-pink-600 hover:text-white",
                        btnColor:
                          "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90",
                        url: lead.social_instagram,
                        dmUrl: getSocialDmLink("instagram", lead.social_instagram),
                        dmLabel: "Open Instagram DM",
                      },
                      {
                        key: "linkedin",
                        name: "LinkedIn",
                        icon: Linkedin,
                        color:
                          "bg-sky-700/10 text-sky-700 border-sky-700/20 hover:bg-sky-700 hover:text-white",
                        btnColor: "bg-sky-700 hover:bg-sky-800 text-white",
                        url: lead.social_linkedin,
                        dmUrl: lead.social_linkedin,
                        dmLabel: "Open LinkedIn Profile",
                      },
                      {
                        key: "x",
                        name: "Twitter/X",
                        icon: Twitter,
                        color:
                          "bg-neutral-900/10 text-neutral-900 border-neutral-950/20 hover:bg-neutral-900 hover:text-white dark:text-white dark:border-white/20 dark:hover:bg-white dark:hover:text-black",
                        btnColor:
                          "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                        url: lead.social_x,
                        dmUrl: getSocialDmLink("x", lead.social_x),
                        dmLabel: "Open X DM",
                      },
                      {
                        key: "tiktok",
                        name: "TikTok",
                        icon: Music,
                        color:
                          "bg-neutral-900/10 text-neutral-900 border-neutral-950/20 hover:bg-neutral-900 hover:text-white dark:text-white dark:border-white/20 dark:hover:bg-white dark:hover:text-black",
                        btnColor:
                          "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100",
                        url: lead.social_tiktok,
                        dmUrl: lead.social_tiktok,
                        dmLabel: "Open TikTok Profile",
                      },
                      {
                        key: "youtube",
                        name: "YouTube",
                        icon: Youtube,
                        color:
                          "bg-red-600/10 text-red-600 border-red-600/20 hover:bg-red-600 hover:text-white",
                        btnColor: "bg-red-600 hover:bg-red-700 text-white",
                        url: lead.social_youtube,
                        dmUrl: lead.social_youtube,
                        dmLabel: "Open YouTube Channel",
                      },
                      {
                        key: "whatsapp",
                        name: "WhatsApp",
                        icon: MessageCircle,
                        color:
                          "bg-green-600/10 text-green-600 border-green-600/20 hover:bg-green-600 hover:text-white",
                        btnColor: "bg-green-600 hover:bg-green-700 text-white",
                        url: null,
                        dmUrl: getSocialDmLink("whatsapp", null, lead.phone),
                        dmLabel: "Chat on WhatsApp",
                      },
                    ];

                    const activeConfigs = socialConfigs.filter(
                      (c) =>
                        (c.key === "whatsapp" && lead.phone) || (c.url && isValidProfileUrl(c.url)),
                    );

                    if (activeConfigs.length === 0) {
                      return (
                        <div className="text-xs text-muted-foreground p-4 rounded-xl border border-dashed border-border/60 bg-muted/5 text-center">
                          No active social media channels detected from the audit. You can add them
                          in the CRM & notes tab.
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {activeConfigs.map((c) => {
                          const IconComp = c.icon;
                          const channelMsg = messages.find((m: any) => m.channel === c.key);
                          const isCopied = copiedChannel === c.key;

                          return (
                            <div
                              key={c.key}
                              className="glass border border-border/60 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`p-1.5 rounded-lg border ${c.color.split(" ")[0]} ${c.color.split(" ")[1]} ${c.color.split(" ")[2]}`}
                                  >
                                    <IconComp className="h-4 w-4" />
                                  </span>
                                  <span className="font-semibold text-sm">{c.name}</span>
                                </div>
                                {c.url && (
                                  <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                  >
                                    Profile <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>

                              <div className="space-y-2">
                                {c.dmUrl && (
                                  <a
                                    href={c.dmUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg font-medium text-center transition-colors text-[11px] ${c.btnColor}`}
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    {c.dmLabel}
                                  </a>
                                )}

                                {c.key !== "youtube" && c.key !== "tiktok" && (
                                  <div className="pt-1.5 border-t border-border/40 flex flex-col gap-1">
                                    {channelMsg ? (
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                          Draft generated
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-1.5 text-[10px] gap-1 hover:bg-primary/10"
                                          onClick={() => handleCopyDraft(channelMsg.body, c.key)}
                                        >
                                          {isCopied ? (
                                            <>
                                              <Check className="h-3 w-3 text-success" />
                                              Copied
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3 w-3" />
                                              Copy message
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-muted-foreground italic">
                                          No draft yet
                                        </span>
                                        <button
                                          className="text-[10px] text-primary hover:underline text-left font-medium"
                                          onClick={() => {
                                            const outreachTrigger = document.querySelector(
                                              '[value="outreach"]',
                                            ) as HTMLButtonElement;
                                            if (outreachTrigger) {
                                              setChannel(c.key as any);
                                              outreachTrigger.click();
                                              toast.info(
                                                `Please generate a draft for ${c.name} here.`,
                                              );
                                            } else {
                                              toast.info(
                                                `Go to Outreach tab and generate a draft for ${c.name}.`,
                                              );
                                            }
                                          }}
                                        >
                                          Generate draft
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4 mt-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Generate personalized outreach</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook DM draft</SelectItem>
                    <SelectItem value="instagram">Instagram DM draft</SelectItem>
                    <SelectItem value="x">X / Twitter</SelectItem>
                    <SelectItem value="contact_form">Contact form copy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="consultative">Consultative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kind</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="followup_1">Follow-up 1</SelectItem>
                    <SelectItem value="followup_2">Follow-up 2</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => draftMut.mutate()}
              disabled={draftMut.isPending}
              className="gap-2"
            >
              {draftMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              Generate draft
            </Button>
          </div>

          <div className="space-y-3">
            {data.messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No drafts yet.</p>
            )}
            {data.messages.map((m: any) => (
              <div key={m.id} className="glass rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2 items-center text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {m.channel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {m.kind}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {m.tone}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                      {m.status}
                    </span>
                  </div>
                  {m.channel === "email" && m.status === "draft" && lead.email && (
                    <a
                      href={`mailto:${lead.email}?subject=${encodeURIComponent(m.subject ?? "")}&body=${encodeURIComponent(m.body ?? "")}`}
                      onClick={() => sendMut.mutate(m.id)}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors animate-pulse"
                      title="Click to send email via your default mail client"
                    >
                      <Mail className="h-3.5 w-3.5" /> {lead.email}
                    </a>
                  )}
                </div>
                {m.subject && <div className="text-sm font-medium">Subject: {m.subject}</div>}
                <pre className="text-sm whitespace-pre-wrap font-sans text-foreground/90">
                  {m.body}
                </pre>
                {m.error && <div className="text-xs text-destructive">{m.error}</div>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Outreach is sent only after you approve. Channels without official sending APIs
            (LinkedIn DM, Facebook DM, Instagram DM, X) generate drafts you can copy.
          </p>
        </TabsContent>

        <TabsContent value="crm" className="space-y-4 mt-4">
          <CrmPanel
            lead={lead}
            onSave={(patch) =>
              update({ data: { id: lead.id, patch } }).then(() => {
                toast.success("Saved");
                qc.invalidateQueries({ queryKey: ["lead", id] });
                qc.invalidateQueries({ queryKey: ["leads"] });
              })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CrmPanel({
  lead,
  onSave,
}: {
  lead: {
    status: string;
    priority: string;
    notes: string | null;
    next_followup_at: string | null;
    email: string | null;
  };
  onSave: (patch: Record<string, unknown>) => Promise<unknown>;
}) {
  const [status, setStatus] = useState(lead.status);
  const [priority, setPriority] = useState(lead.priority);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [followup, setFollowup] = useState(lead.next_followup_at?.slice(0, 16) ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
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
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Next follow-up</Label>
          <Input
            type="datetime-local"
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Contact email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hello@business.com"
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button
        onClick={async () => {
          setSaving(true);
          await onSave({
            status,
            priority,
            notes,
            email: email || null,
            next_followup_at: followup ? new Date(followup).toISOString() : null,
          });
          setSaving(false);
        }}
        disabled={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
      </Button>
    </div>
  );
}
