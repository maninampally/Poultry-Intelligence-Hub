import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "good" | "warn" | "bad" | "primary";
  className?: string;
  testId?: string;
}

const toneClass: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "border-card-border bg-card",
  good: "border-card-border bg-card",
  warn: "border-card-border bg-card",
  bad: "border-card-border bg-card",
  primary: "border-card-border bg-card",
};

const accentDot: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted-foreground/30",
  good: "bg-[hsl(142,52%,42%)]",
  warn: "bg-[hsl(38,90%,50%)]",
  bad: "bg-[hsl(0,72%,52%)]",
  primary: "bg-primary",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default", className, testId }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5 shadow-xs hover-elevate transition-all",
        toneClass[tone],
        className,
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", accentDot[tone])} />
          {label}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" strokeWidth={2} />}
      </div>
      <div className="mt-3 text-2xl sm:text-[28px] font-bold tabular text-foreground leading-tight">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
