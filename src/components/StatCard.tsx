import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: number;
  className?: string;
}

export function StatCard({ label, value, hint, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 relative overflow-hidden group transition-all hover:-translate-y-0.5",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--gradient-primary)] mix-blend-overlay pointer-events-none"
        style={{ maskImage: "radial-gradient(circle at top right, black, transparent 70%)" }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      {typeof trend === "number" && (
        <div
          className={cn(
            "mt-3 text-xs font-medium",
            trend >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}
