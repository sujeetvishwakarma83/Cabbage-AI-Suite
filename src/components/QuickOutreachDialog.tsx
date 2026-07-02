import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLead, updateLead } from "@/lib/leads.functions";
import { runAudit } from "@/lib/audit.functions";
import { generateOutreach } from "@/lib/outreach.functions";
import { sendOutreachEmail } from "@/lib/email.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { ScoreRing } from "@/components/ScoreRing";
import {
  Mail,
  MessageSquare,
  ExternalLink,
  Globe,
  Phone,
  Star,
  Send,
  Loader2,
  Sparkles,
  Copy,
  CheckCircle2,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MapPin,
  Pencil,
  Save,
  MessageCircle,
  Music,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

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
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 animate-in fade-in-50 duration-300 relative overflow-hidden">
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

interface QuickOutreachDialogProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QuickOutreachDialog({
  leadId,
  open,
  onOpenChange,
  onSuccess,
}: QuickOutreachDialogProps) {
  const qc = useQueryClient();
  const fetchLead = useServerFn(getLead);
  const audit = useServerFn(runAudit);
  const draft = useServerFn(generateOutreach);
  const send = useServerFn(sendOutreachEmail);
  const update = useServerFn(updateLead);

  const [activeTab, setActiveTab] = useState<string>("details");
  const [channel, setChannel] = useState<
    "email" | "linkedin" | "facebook" | "instagram" | "x" | "contact_form"
  >("email");
  const [tone, setTone] = useState<"professional" | "friendly" | "premium" | "consultative">(
    "professional",
  );
  const [kind, setKind] = useState<
    "initial" | "short" | "long" | "followup_1" | "followup_2" | "final"
  >("initial");

  const [emailInput, setEmailInput] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const handleCopyDraft = (text: string, channelName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelName);
    toast.success(`Copied ${channelName} message draft!`);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  // Fetch lead data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => {
      if (!leadId) return null;
      return fetchLead({ data: { id: leadId } });
    },
    enabled: !!leadId && open,
  });

  // Sync email input field
  useEffect(() => {
    if (data?.lead) {
      setEmailInput(data.lead.email ?? "");
    }
  }, [data]);

  // Mutations
  const auditMut = useMutation({
    mutationFn: () => audit({ data: { leadId: leadId! } }),
    onSuccess: () => {
      toast.success("AI Website Audit Complete!");
      refetch();
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      if (onSuccess) onSuccess();
      setActiveTab("outreach"); // Auto navigate to outreach after audit
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMut = useMutation({
    mutationFn: () => draft({ data: { leadId: leadId!, channel, tone, kind } }),
    onSuccess: () => {
      toast.success("Outreach Message Draft Generated!");
      refetch();
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      if (onSuccess) onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: (messageId: string) => send({ data: { messageId } }),
    onSuccess: () => {
      toast.success("Outreach Email Sent Successfully!");
      refetch();
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      if (onSuccess) onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEmailMut = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: leadId!,
          patch: { email: emailInput || null },
        },
      }),
    onSuccess: () => {
      toast.success("Email Address Updated!");
      setIsEditingEmail(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      if (onSuccess) onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyToClipboard = (text: string, type: "body" | "subject") => {
    navigator.clipboard.writeText(text);
    if (type === "body") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  if (!leadId) return null;

  const lead = data?.lead;
  const latestAudit = data?.audits?.[0];
  const messages = data?.messages ?? [];
  const latestMessage = messages.find((m: any) => m.channel === channel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl glass-strong border border-border/80 text-foreground rounded-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !lead ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Lead Details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight">{lead.business_name}</h2>
                  <LeadStatusBadge status={lead.status} />
                  {lead.rating != null && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {lead.rating} ({lead.reviews_count ?? 0})
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {[lead.category, lead.address].filter(Boolean).join(" · ")}
                </div>
                <div className="flex flex-wrap gap-3 text-xs pt-1.5 text-muted-foreground">
                  {lead.website && (
                    <a
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {lead.website.replace(/^https?:\/\//, "").slice(0, 45)}
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
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
              </div>
              {latestAudit?.overall_score != null && (
                <div className="flex items-center gap-2">
                  <ScoreRing score={latestAudit.overall_score} size={80} label="Score" />
                </div>
              )}
            </div>

            {/* Email Editing Panel */}
            <div className="glass rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {isEditingEmail ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="restaurant@email.com"
                      className="h-8 py-0 bg-background/50 flex-1 max-w-[280px]"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateEmailMut.mutate()}
                      disabled={updateEmailMut.isPending}
                      className="h-8 px-2"
                    >
                      {updateEmailMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 text-success" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEmailInput(lead.email ?? "");
                        setIsEditingEmail(false);
                      }}
                      className="h-8 px-2 text-destructive"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">No email found</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingEmail(true)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Social Channels Link Row */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">Socials:</span>
                <div className="flex gap-2">
                  {lead.social_facebook && isValidProfileUrl(lead.social_facebook) ? (
                    <a
                      href={lead.social_facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:scale-110 transition-transform bg-primary/10 p-1.5 rounded-lg"
                      title="Facebook Profile"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/30 p-1.5 bg-muted/20 rounded-lg">
                      <Facebook className="h-4 w-4" />
                    </span>
                  )}
                  {lead.social_instagram && isValidProfileUrl(lead.social_instagram) ? (
                    <a
                      href={lead.social_instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:scale-110 transition-transform bg-primary/10 p-1.5 rounded-lg"
                      title="Instagram Profile"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/30 p-1.5 bg-muted/20 rounded-lg">
                      <Instagram className="h-4 w-4" />
                    </span>
                  )}
                  {lead.social_linkedin && isValidProfileUrl(lead.social_linkedin) ? (
                    <a
                      href={lead.social_linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:scale-110 transition-transform bg-primary/10 p-1.5 rounded-lg"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/30 p-1.5 bg-muted/20 rounded-lg">
                      <Linkedin className="h-4 w-4" />
                    </span>
                  )}
                  {lead.social_x && isValidProfileUrl(lead.social_x) ? (
                    <a
                      href={lead.social_x}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:scale-110 transition-transform bg-primary/10 p-1.5 rounded-lg"
                      title="Twitter/X Profile"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/30 p-1.5 bg-muted/20 rounded-lg">
                      <Twitter className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30">
                <TabsTrigger value="details">Lead Info</TabsTrigger>
                <TabsTrigger value="audit">Website Audit</TabsTrigger>
                <TabsTrigger value="outreach">AI Outreach Drafts</TabsTrigger>
              </TabsList>

              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="glass rounded-xl p-5 space-y-3">
                  <h4 className="font-semibold text-base">Lead Overview</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Status</span>
                      <span className="font-medium flex items-center gap-1.5 mt-0.5">
                        <LeadStatusBadge status={lead.status} />
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Priority</span>
                      <span className="font-medium mt-0.5 capitalize">
                        {lead.priority ?? "n/a"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Address</span>
                      <span className="font-medium mt-0.5 block">{lead.address ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Category</span>
                      <span className="font-medium mt-0.5 block">{lead.category ?? "—"}</span>
                    </div>
                  </div>
                  {lead.notes && (
                    <div className="border-t border-border/40 pt-3 mt-3">
                      <span className="text-muted-foreground block text-xs mb-1">CRM Notes</span>
                      <p className="text-xs italic bg-muted/20 p-2.5 rounded-lg border border-border/40">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button onClick={() => setActiveTab("audit")} className="gap-2">
                    Next: Audit Website <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* AUDIT TAB */}
              <TabsContent value="audit" className="space-y-4 pt-4">
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-semibold text-base">Website Audit Status</h4>
                      <p className="text-xs text-muted-foreground">
                        Analyze design, SEO structure, missing pages, and load speeds.
                      </p>
                    </div>
                    <Button
                      onClick={() => auditMut.mutate()}
                      disabled={auditMut.isPending || !lead.website}
                      className="gap-2 shrink-0"
                    >
                      {auditMut.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Auditing Site...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {latestAudit ? "Re-run audit" : "Run Website Audit"}
                        </>
                      )}
                    </Button>
                  </div>

                  {!lead.website && (
                    <div className="p-4 rounded-xl bg-warning/10 text-warning text-sm border border-warning/20">
                      <strong>Note:</strong> This lead does not have a website URL. To run an audit,
                      please find the website and update the lead details, or proceed directly to
                      Outreach to write a listing improvement message.
                    </div>
                  )}

                  {auditMut.isPending && <AuditProgressScanner website={lead.website!} />}

                  {latestAudit && !auditMut.isPending && (
                    <div className="space-y-4 animate-in fade-in-50 duration-200">
                      <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 text-sm">
                        <p className="font-semibold text-primary mb-1">Audit Summary:</p>
                        <p className="text-foreground/90 text-xs leading-relaxed">
                          {latestAudit.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {Object.entries((latestAudit.scores ?? {}) as Record<string, number>).map(
                          ([k, v]) => (
                            <div
                              key={k}
                              className="rounded-xl border border-border/60 p-2.5 text-center bg-card/20"
                            >
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {k.replace(/_/g, " ")}
                              </div>
                              <div className="text-xl font-bold mt-0.5">{v}</div>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                            Critical Issues
                          </h5>
                          <ul className="space-y-1.5 max-h-[160px] overflow-y-auto">
                            {((latestAudit.issues ?? []) as any[]).map((i, idx) => (
                              <li
                                key={idx}
                                className="rounded-lg border border-border/50 p-2 text-xs bg-muted/10"
                              >
                                <div className="flex justify-between font-medium">
                                  <span>{i.area}</span>
                                  <span
                                    className={`text-[10px] uppercase ${
                                      i.severity === "high"
                                        ? "text-destructive"
                                        : i.severity === "medium"
                                          ? "text-warning"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {i.severity}
                                  </span>
                                </div>
                                <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                                  {i.detail}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                            Improvement Suggestions ({latestAudit.estimated_roi})
                          </h5>
                          <ul className="space-y-1.5 max-h-[160px] overflow-y-auto">
                            {((latestAudit.suggestions ?? []) as any[]).map((s, idx) => (
                              <li
                                key={idx}
                                className="rounded-lg border border-border/50 p-2 text-xs bg-muted/10"
                              >
                                <div className="flex justify-between font-medium">
                                  <span>{s.title}</span>
                                  <span className="text-[10px] text-success">
                                    +{s.estimated_uplift_pct}%
                                  </span>
                                </div>
                                <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                                  {s.benefit}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {latestAudit.missing_features && latestAudit.missing_features.length > 0 && (
                        <div>
                          <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
                            Missing Features / Pages
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {latestAudit.missing_features.map((f: string) => (
                              <span
                                key={f}
                                className="text-[10px] font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5"
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
                          <h5 className="font-semibold text-sm flex items-center gap-1.5">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            Detected Social Channels & Quick Messaging
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
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
                              (c.key === "whatsapp" && lead.phone) ||
                              (c.url && isValidProfileUrl(c.url)),
                          );

                          if (activeConfigs.length === 0) {
                            return (
                              <div className="text-xs text-muted-foreground p-4 rounded-xl border border-dashed border-border/60 bg-muted/5 text-center">
                                No active social media channels detected from the audit. You can add
                                them in the Lead Info tab.
                              </div>
                            );
                          }

                          return (
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mt-2">
                              {activeConfigs.map((c) => {
                                const IconComp = c.icon;
                                const channelMsg = messages.find((m: any) => m.channel === c.key);
                                const isCopied = copiedChannel === c.key;

                                return (
                                  <div
                                    key={c.key}
                                    className="glass border border-border/60 rounded-xl p-3 flex flex-col justify-between gap-2.5 text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`p-1.5 rounded-lg border ${c.color.split(" ")[0]} ${c.color.split(" ")[1]} ${c.color.split(" ")[2]}`}
                                        >
                                          <IconComp className="h-3.5 w-3.5" />
                                        </span>
                                        <span className="font-semibold text-xs">{c.name}</span>
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

                                    <div className="space-y-1.5">
                                      {c.dmUrl && (
                                        <a
                                          href={c.dmUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`inline-flex items-center justify-center gap-1 w-full py-1.5 px-2.5 rounded-lg font-medium text-center transition-colors text-[10px] ${c.btnColor}`}
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          {c.dmLabel}
                                        </a>
                                      )}

                                      {c.key !== "youtube" && c.key !== "tiktok" && (
                                        <div className="pt-1.5 border-t border-border/40 flex flex-col gap-1">
                                          {channelMsg ? (
                                            <div className="flex items-center justify-between gap-1.5">
                                              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                                Draft generated
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-1.5 text-[10px] gap-1 hover:bg-primary/10"
                                                onClick={() =>
                                                  handleCopyDraft(channelMsg.body, c.key)
                                                }
                                              >
                                                {isCopied ? (
                                                  <>
                                                    <Check className="h-3 w-3 text-success" />
                                                    Copied
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="h-3 w-3" />
                                                    Copy
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-between gap-1.5">
                                              <span className="text-[10px] text-muted-foreground italic">
                                                No draft
                                              </span>
                                              <button
                                                className="text-[10px] text-primary hover:underline text-left font-medium"
                                                onClick={() => {
                                                  setChannel(c.key as any);
                                                  setActiveTab("outreach");
                                                  toast.info(
                                                    `Please generate a draft for ${c.name} here.`,
                                                  );
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

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("details")}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("outreach")} className="gap-2">
                    Next: Generate Outreach <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* OUTREACH TAB */}
              <TabsContent value="outreach" className="space-y-4 pt-4">
                <div className="glass rounded-xl p-5 space-y-4">
                  <div>
                    <h4 className="font-semibold text-base">Write Custom Outreach Message</h4>
                    <p className="text-xs text-muted-foreground">
                      Select target platform and tone. Gemini will draft a personalized proposal
                      pointing out the website issues.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Channel / Platform</Label>
                      <Select
                        value={channel}
                        onValueChange={(v) => setChannel(v as typeof channel)}
                      >
                        <SelectTrigger className="h-9 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="linkedin">LinkedIn DM</SelectItem>
                          <SelectItem value="facebook">Facebook DM</SelectItem>
                          <SelectItem value="instagram">Instagram DM</SelectItem>
                          <SelectItem value="x">X / Twitter DM</SelectItem>
                          <SelectItem value="contact_form">Website Contact Form</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Tone</Label>
                      <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                        <SelectTrigger className="h-9 bg-background/50">
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

                    <div className="space-y-1">
                      <Label className="text-xs">Format</Label>
                      <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                        <SelectTrigger className="h-9 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="initial">Initial Pitch</SelectItem>
                          <SelectItem value="short">Short Message</SelectItem>
                          <SelectItem value="long">Detailed Pitch</SelectItem>
                          <SelectItem value="followup_1">Follow-up 1</SelectItem>
                          <SelectItem value="followup_2">Follow-up 2</SelectItem>
                          <SelectItem value="final">Final Try</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={() => draftMut.mutate()}
                    disabled={draftMut.isPending}
                    className="w-full gap-2 mt-2"
                  >
                    {draftMut.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Draft Proposal...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Custom Message
                      </>
                    )}
                  </Button>
                </div>

                {/* Display outreach draft if any */}
                {latestMessage ? (
                  <div className="glass rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                          {latestMessage.channel}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {latestMessage.kind}
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          Status: {latestMessage.status}
                        </span>
                      </div>

                      {/* Direct actions */}
                      <div className="flex gap-2">
                        {latestMessage.channel === "email" &&
                          latestMessage.status === "draft" &&
                          lead.email && (
                            <a
                              href={`mailto:${lead.email}?subject=${encodeURIComponent(latestMessage.subject ?? "")}&body=${encodeURIComponent(latestMessage.body ?? "")}`}
                              onClick={() => sendMut.mutate(latestMessage.id)}
                              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-success text-white hover:bg-success/90 transition-colors animate-pulse"
                              title="Click to send email via your default mail client"
                            >
                              <Mail className="h-3.5 w-3.5" /> {lead.email}
                            </a>
                          )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(latestMessage.body, "body")}
                          className="gap-1.5 h-8 px-2.5 text-xs"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Copy Message
                        </Button>
                      </div>
                    </div>

                    {latestMessage.subject && (
                      <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between gap-3 text-xs border border-border/40">
                        <div className="font-sans">
                          <span className="font-semibold text-muted-foreground mr-1.5">
                            Subject:
                          </span>
                          <span className="text-foreground font-medium">
                            {latestMessage.subject}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(latestMessage.subject!, "subject")}
                          className="h-6 w-6 p-0 shrink-0 text-muted-foreground"
                          title="Copy Subject"
                        >
                          {copiedSubject ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}

                    <pre className="text-xs bg-muted/40 p-4 rounded-xl font-sans whitespace-pre-wrap leading-relaxed text-foreground/90 border border-border/40 max-h-[300px] overflow-y-auto">
                      {latestMessage.body}
                    </pre>

                    {/* Social Media Link & Assist Callout */}
                    {channel !== "email" && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-xs">
                        <p className="font-semibold text-primary">How to send this manually:</p>
                        <p className="text-muted-foreground text-[11px] leading-tight">
                          1. Click the <strong>Copy Message</strong> button above.
                          <br />
                          2. Open the lead's social media page using the button below.
                          <br />
                          3. Click "Message / DM" and paste the copied message!
                        </p>
                        <div className="flex gap-2 pt-1">
                          {channel === "facebook" && lead.social_facebook && (
                            <a
                              href={lead.social_facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                              <Facebook className="h-3.5 w-3.5" />
                              Open Facebook Page
                            </a>
                          )}
                          {channel === "instagram" && lead.social_instagram && (
                            <a
                              href={lead.social_instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white rounded-lg font-medium transition-colors"
                            >
                              <Instagram className="h-3.5 w-3.5" />
                              Open Instagram Profile
                            </a>
                          )}
                          {channel === "linkedin" && lead.social_linkedin && (
                            <a
                              href={lead.social_linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                              Open LinkedIn Profile
                            </a>
                          )}
                          {channel === "x" && lead.social_x && (
                            <a
                              href={lead.social_x}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors"
                            >
                              <Twitter className="h-3.5 w-3.5" />
                              Open Twitter/X
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl">
                    No custom message generated yet for {channel}. Adjust tone and click "Generate
                    Custom Message".
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("audit")}>
                    Back
                  </Button>
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    Done
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
