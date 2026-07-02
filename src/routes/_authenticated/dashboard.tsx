import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardStats } from "@/lib/leads.functions";
import { StatCard } from "@/components/StatCard";
import {
  Users,
  FileSearch,
  Mail,
  MessageSquare,
  Reply,
  Star,
  Bell,
  TrendingUp,
  DollarSign,
  Target,
  Home,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CabbageCode" }] }),
  component: Dashboard,
});

const COLORS = [
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

function Dashboard() {
  const fetchStats = useServerFn(dashboardStats);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  useEffect(() => {
    const ch = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const pieData = Object.entries(data?.statusBreakdown ?? {}).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening in your pipeline today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/finder">
            <Button className="gap-2">Find new clients</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Today's Leads"
          value={data?.todayLeads ?? 0}
          icon={<Users className="h-5 w-5" />}
          hint={`${data?.totalLeads ?? 0} total`}
        />
        <StatCard
          label="Audits Today"
          value={data?.todayAudits ?? 0}
          icon={<FileSearch className="h-5 w-5" />}
          hint={`Avg score ${data?.avgScore ?? 0}/100`}
        />
        <StatCard
          label="Messages Ready"
          value={data?.draftMsgs ?? 0}
          icon={<MessageSquare className="h-5 w-5" />}
          hint="Awaiting your review"
        />
        <StatCard
          label="Emails Sent"
          value={data?.sentCount ?? 0}
          icon={<Mail className="h-5 w-5" />}
        />
        <StatCard
          label="Replies"
          value={data?.repliedCount ?? 0}
          icon={<Reply className="h-5 w-5" />}
        />
        <StatCard
          label="Interested"
          value={data?.interestedCount ?? 0}
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          label="Follow-ups Due"
          value={data?.followupsDue ?? 0}
          icon={<Bell className="h-5 w-5" />}
        />
        <StatCard
          label="Conversion Rate"
          value={`${data?.conversionRate ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Revenue Estimate"
          value={`$${(data?.revenueEstimate ?? 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          hint="At $2.5k/client"
        />
        <StatCard
          label="Avg Site Score"
          value={`${data?.avgScore ?? 0}/100`}
          icon={<Target className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Activity — last 14 days</h3>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Leads
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Audits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-3" />
                Messages
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data?.timeline ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
                <Area
                  type="monotone"
                  dataKey="audits"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#g2)"
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="var(--color-chart-3)"
                  strokeWidth={2}
                  fill="url(#g3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Pipeline status</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pieData.map((s) => (
              <LeadStatusBadge key={s.name} status={s.name} />
            ))}
            {pieData.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground">
                No leads yet — start with the Client Finder.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
