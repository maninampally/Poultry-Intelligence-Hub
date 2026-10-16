import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { syncLabels } from "@/domain/calc"
import type { SyncStatus } from "@/domain/types"
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
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight">{title}</h1>
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
    <Card className="min-w-0">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "font-display text-3xl font-semibold tabular-nums sm:text-4xl",
            tone === "alert" && "text-destructive",
            tone === "good" && "text-primary",
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  )
}

export function SyncBadge({ status }: { status: SyncStatus }) {
  return (
    <Badge variant={status === "synced" ? "secondary" : "outline"} className="h-7 px-2">
      {syncLabels[status]}
    </Badge>
  )
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "good" | "warn" | "bad"
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "good" && "bg-primary/10 text-primary",
        tone === "warn" && "bg-amber-100 text-amber-950",
        tone === "bad" && "bg-destructive/10 text-destructive",
      )}
    >
      {children}
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
    <div className="flex items-baseline justify-between gap-4 border-b py-2 text-sm last:border-b-0">
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
            <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Back to Today
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  return children
}
