import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLeads } from "@/lib/leads.functions";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isPast } from "date-fns";

export const Route = createFileRoute("/_authenticated/followups")({
  head: () => ({ meta: [{ title: "Follow-ups — CabbageCode" }] }),
  component: FollowupsPage,
});

function FollowupsPage() {
  const fetchLeads = useServerFn(listLeads);
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => fetchLeads() });
  const upcoming = leads
    .filter((l: any) => l.next_followup_at)
    .sort(
      (a: any, b: any) =>
        new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime(),
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Reminders queued at 3, 7, 15, 30 days — your approval required to send.
        </p>
      </div>
      {upcoming.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No follow-ups scheduled. Set one from any lead's CRM tab.
        </div>
      )}
      <div className="space-y-2">
        {upcoming.map((l: any) => {
          const due = new Date(l.next_followup_at!);
          const overdue = isPast(due);
          return (
            <div
              key={l.id}
              className={`glass rounded-xl p-4 flex items-center justify-between gap-3 ${overdue ? "ring-1 ring-warning/40" : ""}`}
            >
              <div>
                <div className="font-medium">{l.business_name}</div>
                <div className="text-xs text-muted-foreground">
                  {[l.city, l.country].filter(Boolean).join(", ")}
                </div>
              </div>
              <div className={`text-sm ${overdue ? "text-warning" : "text-muted-foreground"}`}>
                {format(due, "MMM d, p")}
                {overdue ? " · overdue" : ""}
              </div>
              <Link to="/leads/$id" params={{ id: l.id }}>
                <Button size="sm" variant="outline">
                  Open
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
