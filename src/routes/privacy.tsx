import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CabbageCode" },
      {
        name: "description",
        content:
          "Review the Privacy Policy for CabbageCode AI Client Finder & Website Audit Automation. Learn how we protect and manage your data.",
      },
      { property: "og:title", content: "Privacy Policy — CabbageCode" },
      {
        property: "og:description",
        content: "Learn how CabbageCode protects and manages your data.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background decorations matching the landing page */}
      <div className="absolute inset-0 bg-background pointer-events-none -z-20" />
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10 animate-pulse duration-10000" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-success/5 blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-auto max-w-full object-contain rounded-xl"
          />
        </Link>
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-3xl mx-auto px-6 py-12 relative z-10">
        <div className="glass rounded-3xl p-8 md:p-12 space-y-8 border border-border/40 shadow-2xl">
          <div className="flex items-center gap-3.5 border-b border-border/20 pb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground mt-1">Last Updated: July 2, 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <p>
              Welcome to CabbageCode. We respect your privacy and are committed to protecting the
              personal data you share with us. This Privacy Policy describes how we collect, use,
              and safeguard your information when you use our website audit and client finder platform.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                To provide our automated audit and CRM features, we may collect the following kinds of
                information:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-foreground/90">Account Information:</strong> If you sign
                  in, we collect basic registration data (such as name and email address) to maintain
                  your account.
                </li>
                <li>
                  <strong className="text-foreground/90">Audit & Business Data:</strong> Information
                  regarding lead targets, search locations, and business categories you query on our
                  platform.
                </li>
                <li>
                  <strong className="text-foreground/90">Usage Statistics:</strong> Device data, IP
                  addresses, browser details, and activity logs mapping your interactions with the site.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>We process your data strictly to facilitate the application functions, including:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Discovering and compiling Google Maps business leads.</li>
                <li>Generating AI website audit reports and outreach templates.</li>
                <li>Saving and managing pipeline status in your personal workspace CRM.</li>
                <li>Optimizing application speeds and monitoring API thresholds.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">3. Data Sharing & Security</h2>
              <p>
                We do not sell, trade, or distribute your lead data or personal information. Some
                queries may trigger anonymized API requests through external systems (e.g. Supabase,
                AI models, Google Places) to compute scores. Your information is safeguarded with
                industry-standard TLS encryption and secure authentication layers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">4. Compliance with Platform TOS</h2>
              <p>
                Our outreach generation is built for convenience. You are solely responsible for
                verifying draft messages and ensuring compliance with the terms of service of third-party
                communication channels (like email, messaging apps, and business listings).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">5. Your Choices & Contact</h2>
              <p>
                You can review, modify, or completely delete your workspace data at any time by
                contacting support. For questions regarding this policy, please reach out to:
              </p>
              <div className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-2xl bg-primary/5 border border-border/40 text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:sujeet.cabbagecode@gmail.com" className="hover:underline text-sm font-medium">
                  sujeet.cabbagecode@gmail.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mini Footer for Privacy Page */}
      <footer className="relative border-t border-border/40 py-6 text-center text-xs text-muted-foreground bg-background/20 backdrop-blur-sm mt-auto z-10">
        © {new Date().getFullYear()} CabbageCode. All rights reserved.
      </footer>
    </div>
  );
}
