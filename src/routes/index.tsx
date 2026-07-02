import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Search, FileSearch, MessageSquare, Users } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CabbageCode — AI Client Finder & Website Audit Automation" },
      {
        name: "description",
        content:
          "Find local businesses, audit their websites with AI, and send personalized outreach — all in one premium CRM.",
      },
      { property: "og:title", content: "CabbageCode — AI Client Finder" },
      {
        property: "og:description",
        content: "Find clients while you sleep with AI-powered audits and outreach.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Search,
    title: "Google Maps lead discovery",
    desc: "Type a city + niche, pull live businesses with rating, reviews, website & contact.",
  },
  {
    icon: FileSearch,
    title: "AI website audit /100",
    desc: "Speed, mobile, SEO, trust, missing features — all scored with prioritized fixes.",
  },
  {
    icon: MessageSquare,
    title: "Personalized outreach",
    desc: "Unique drafts per channel and tone, ready for your review before sending.",
  },
  {
    icon: Users,
    title: "Beautiful CRM",
    desc: "Status pipeline, tags, follow-ups, and revenue estimates — all glass + dark.",
  },
];

const stats = [
  "148 AI website audits completed today",
  "94 Local leads discovered this hour",
  "12 Client meetings booked this week",
  "Average lead conversion rate up by +25%",
];

function Landing() {
  const [activeStat, setActiveStat] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % stats.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-9 w-auto max-w-full object-contain rounded-xl"
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button>Open Dashboard</Button>
          </Link>
        </div>
      </header>

      <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs transition-all duration-500 hover:scale-105 cursor-pointer">
          <span className="h-2 w-2 rounded-full bg-success animate-ping" />
          <span
            className="font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
            key={activeStat}
          >
            {stats[activeStat]}
          </span>
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight">
          Find clients <span className="gradient-text">while you sleep.</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          One platform to discover local businesses, audit their websites with AI, draft
          personalized outreach, and manage every lead — saving hours every single day.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard">
            <Button size="lg" className="gap-2 glow-primary">
              Start working <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              See dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 space-y-3 hover:-translate-y-1 transition-transform"
            >
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © CabbageCode · Outreach respects every destination platform's TOS and requires your review
        before sending.
      </footer>
    </div>
  );
}
