import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLeads } from "@/lib/leads.functions";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Search, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { QuickOutreachDialog } from "@/components/QuickOutreachDialog";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads & CRM — CabbageCode" }] }),
  component: LeadsPage,
});

type Lead = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof listLeads>>>>[number];

function LeadsPage() {
  const fetchLeads = useServerFn(listLeads);
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [hasEmail, setHasEmail] = useState("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(
    () =>
      leads.filter((l: Lead) => {
        if (status !== "all" && l.status !== status) return false;
        if (hasEmail === "yes" && !l.email) return false;
        if (hasEmail === "no" && l.email) return false;
        if (q) {
          const s = q.toLowerCase();
          if (
            !`${l.business_name} ${l.city ?? ""} ${l.country ?? ""} ${l.category ?? ""}`
              .toLowerCase()
              .includes(s)
          )
            return false;
        }
        return true;
      }),
    [leads, q, status, hasEmail],
  );

  function exportCSV() {
    if (filtered.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "business_name",
      "website",
      "phone",
      "email",
      "city",
      "country",
      "category",
      "rating",
      "reviews_count",
      "status",
      "priority",
    ];
    const rows = filtered.map((l: Lead) =>
      headers.map((h) => JSON.stringify((l as Record<string, unknown>)[h] ?? "")).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads & CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} of {leads.length} leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Link to="/finder">
            <Button>Find more</Button>
          </Link>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, category…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
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
        <Select value={hasEmail} onValueChange={setHasEmail}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any contact</SelectItem>
            <SelectItem value="yes">Has email</SelectItem>
            <SelectItem value="no">No email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Website</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No leads match. Try the Finder.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((l: Lead) => (
              <TableRow key={l.id} className="hover:bg-primary/5">
                <TableCell className="font-medium">{l.business_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {[l.city, l.country].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-sm">{l.category ?? "—"}</TableCell>
                <TableCell>
                  {l.rating != null && (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {l.rating}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={l.status} />
                </TableCell>
                <TableCell>
                  {l.website && (
                    <a
                      href={l.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedLeadId(l.id);
                        setDialogOpen(true);
                      }}
                      className="gap-1 text-primary hover:text-primary/80"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Analyze
                    </Button>
                    <Link to="/leads/$id" params={{ id: l.id }}>
                      <Button size="sm" variant="ghost">
                        Open
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuickOutreachDialog leadId={selectedLeadId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
