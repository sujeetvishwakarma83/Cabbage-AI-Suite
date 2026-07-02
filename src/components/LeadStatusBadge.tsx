import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  audited: "bg-info/15 text-info border-info/30",
  message_ready: "bg-primary/15 text-primary border-primary/30",
  sent: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  replied: "bg-warning/15 text-warning border-warning/30",
  interested: "bg-success/15 text-success border-success/30",
  meeting: "bg-success/20 text-success border-success/40",
  proposal_sent: "bg-accent text-accent-foreground",
  won: "bg-success text-primary-foreground",
  lost: "bg-destructive/15 text-destructive border-destructive/30",
};

const LABELS: Record<string, string> = {
  new: "New",
  audited: "Audited",
  message_ready: "Message Ready",
  sent: "Sent",
  replied: "Replied",
  interested: "Interested",
  meeting: "Meeting",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border", COLORS[status] ?? "bg-muted text-muted-foreground")}
    >
      {LABELS[status] ?? status}
    </Badge>
  );
}
