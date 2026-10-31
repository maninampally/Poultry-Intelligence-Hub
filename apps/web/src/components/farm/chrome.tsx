import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, CheckCircle2, CircleAlert, Clock, Eye, Info } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { syncLabels } from "@/domain/calc"
import type { Severity, SyncStatus } from "@/domain/types"
import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-lg leading-snug font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "alert" | "good"
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-4 py-3.5">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "mt-2 text-[1.7rem] leading-none font-bold tracking-tight tabular-nums",
          tone === "alert" && "text-orange-600",
          tone === "good" && "text-emerald-600",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function SyncBadge({ status }: { status: SyncStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "synced" ? "bg-emerald-600" : "bg-amber-500",
        )}
      />
      {syncLabels[status]}
    </span>
  )
}

const toneIcon: Record<"neutral" | "good" | "warn" | "bad", LucideIcon> = {
  neutral: Info,
  good: CheckCircle2,
  warn: Clock,
  bad: AlertTriangle,
}

export function StatusPill({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode
  tone?: "neutral" | "good" | "warn" | "bad"
  icon?: LucideIcon
}) {
  const Icon = icon ?? toneIcon[tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        tone === "neutral" && "text-muted-foreground",
        tone === "good" && "text-emerald-600",
        tone === "warn" && "text-amber-600",
        tone === "bad" && "text-orange-600",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  )
}

// Severity shown as icon + word so it never relies on colour alone.
// Shared by Alerts and My Tasks so both screens read the same way.
const severityMeta: Record<
  Severity,
  { label: string; level: string; icon: LucideIcon; tone: "neutral" | "good" | "warn" | "bad" }
> = {
  urgent: { label: "At risk", level: "High", icon: CircleAlert, tone: "bad" },
  attention: { label: "Watch", level: "Medium", icon: AlertTriangle, tone: "warn" },
  due: { label: "Due", level: "Medium", icon: Clock, tone: "warn" },
  information: { label: "Note", level: "Low", icon: Info, tone: "neutral" },
}

const workStatusMeta: Record<
  string,
  { label: string; icon: LucideIcon; tone: "neutral" | "good" | "warn" | "bad" }
> = {
  open: { label: "Open", icon: Clock, tone: "neutral" },
  acknowledged: { label: "Acknowledged", icon: Eye, tone: "warn" },
  resolved: { label: "Resolved", icon: CheckCircle2, tone: "good" },
}

export function SeverityBadge({ severity, status }: { severity: Severity; status?: string }) {
  const meta = severityMeta[severity]
  const work = status ? workStatusMeta[status] : undefined
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
      <StatusPill tone={meta.tone} icon={meta.icon}>
        {meta.label}
      </StatusPill>
      <span className="text-muted-foreground">{meta.level}</span>
      {work ? (
        <StatusPill tone={work.tone} icon={work.icon}>
          {work.label}
        </StatusPill>
      ) : null}
    </span>
  )
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">{children}</p>
  )
}

export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function MoneyGate({
  role,
  children,
}: {
  role: "owner" | "manager" | "worker"
  children: ReactNode
}) {
  if (role !== "owner") {
    return (
      <div>
        <PageHeader
          eyebrow="Business"
          title="Finance stays with the owner"
          description="This view does not include costs, prices, margins, or balances."
        />
        <Card>
          <CardHeader>
            <CardTitle>Operational work is still available</CardTitle>
            <CardDescription>
              Daily rounds, mortality, feed quantities, and tasks stay open. Switch the header to Owner to
              review money.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard" className="text-sm font-medium underline-offset-4 hover:underline">
              Back to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  return children
}
