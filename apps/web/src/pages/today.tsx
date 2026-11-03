/**
 * U1 Home — flock status in 5–10 seconds.
 * One status + one alert + morning-round CTA + sync. No decorative charts.
 */
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Bird,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  Eye,
  RefreshCw,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, StatusPill } from "@/components/farm/chrome"
import { formatFeed, formatNumber, showCount } from "@/domain/format"
import { pendingSyncCount, useFarm } from "@/store/farm-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type FlockStatus = "Normal" | "Watch" | "Act"

function flockStatus(args: {
  runwayDays: number | null
  todayMortality: number | null
  urgentAlerts: number
  score: number | null
}): FlockStatus {
  if (
    args.urgentAlerts > 0 ||
    (args.runwayDays !== null && args.runwayDays < 3) ||
    (args.todayMortality !== null && args.todayMortality > 15)
  ) {
    return "Act"
  }
  if (
    (args.runwayDays !== null && args.runwayDays < 7) ||
    (args.score !== null && args.score < 70) ||
    (args.todayMortality !== null && args.todayMortality > 5)
  ) {
    return "Watch"
  }
  return "Normal"
}

function statusTone(status: FlockStatus): "good" | "warn" | "bad" {
  if (status === "Normal") return "good"
  if (status === "Watch") return "warn"
  return "bad"
}

function StatusIcon({ status }: { status: FlockStatus }) {
  if (status === "Normal") return <CheckCircle2 className="size-5" aria-hidden />
  if (status === "Watch") return <Eye className="size-5" aria-hidden />
  return <AlertTriangle className="size-5" aria-hidden />
}

export function TodayPage() {
  const farm = useFarm()
  if (!farm.batch || farm.state.batches.length === 0) {
    return <DashboardEmptyState />
  }

  const openAlerts = farm.alerts.filter((alert) => alert.status !== "resolved")
  const urgentAlerts = openAlerts.filter((alert) => alert.severity === "urgent").length
  const score =
    farm.completeness.expected === 0
      ? null
      : Math.round((farm.completeness.recorded / farm.completeness.expected) * 100)
  const status = flockStatus({
    runwayDays: farm.runwayDays,
    todayMortality: farm.todayMortality,
    urgentAlerts,
    score,
  })
  const roundDone = Boolean(farm.todayRound && !farm.todayRound.draft)
  const roundLabel = !farm.todayRound ? "Not started" : farm.todayRound.draft ? "Draft" : "Done"
  const pending = pendingSyncCount(farm.state)
  const topAlert = openAlerts.find((alert) => alert.severity === "urgent") ?? openAlerts[0]
  const runway =
    farm.runwayDays === null ? "Unknown" : `${formatNumber(farm.runwayDays, 1)} days left`

  const meaning =
    status === "Act"
      ? "Something needs action today — open the alert or finish the morning round."
      : status === "Watch"
        ? "Keep an eye on this flock. Log deaths and feed if you have not yet."
        : "Flock looks steady. Still log the morning round so nothing is missed."

  return (
    <div className="mx-auto max-w-lg">
      {pending > 0 ? (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
          role="status"
        >
          <CloudOff className="size-4 shrink-0" aria-hidden />
          <p className="flex-1 text-sm">
            <span className="font-semibold">{pending} {pending === 1 ? "record" : "records"}</span>{" "}
            saved on this device. Demo has not sent them to a server.
          </p>
          <button
            type="button"
            className="inline-flex min-h-12 items-center gap-1.5 text-sm font-semibold text-teal-800"
            onClick={() => {
              farm.dispatch({ type: "sync-now" })
              toast.success("Marked synced in this demo. Nothing was sent to a server.")
            }}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Sync now
          </button>
        </div>
      ) : (
        <div
          className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground"
          role="status"
        >
          <Wifi className="size-3.5 text-emerald-600" aria-hidden />
          Demo sync clear — nothing waiting on this device.
        </div>
      )}

      <PageHeader
        eyebrow={farm.settings.location || "Your farm"}
        title="Today"
        description={`${farm.batch.code} · Day ${farm.day} · ${farm.batch.breed}`}
      />

      {/* Hero: status */}
      <Card className="mb-3">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Flock status
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill
                  tone={statusTone(status)}
                  icon={
                    status === "Normal"
                      ? CheckCircle2
                      : status === "Watch"
                        ? Eye
                        : AlertTriangle
                  }
                >
                  {status}
                </StatusPill>
              </div>
            </div>
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                status === "Normal" && "bg-emerald-50 text-emerald-700",
                status === "Watch" && "bg-amber-50 text-amber-800",
                status === "Act" && "bg-orange-50 text-orange-700",
              )}
              aria-hidden
            >
              <StatusIcon status={status} />
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{meaning}</p>
          <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Birds left</p>
              <p className="text-lg font-bold tabular-nums">{formatNumber(farm.live)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Morning round</p>
              <p className="text-lg font-bold">{roundLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deaths today</p>
              <p className="text-lg font-bold tabular-nums">
                {farm.todayMortality === null ? "—" : showCount(farm.todayMortality)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Feed runway</p>
              <p className="text-lg font-bold">{runway}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* One alert */}
      <Card className="mb-3">
        <CardContent className="space-y-2 pt-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Needs attention
          </p>
          {topAlert ? (
            <>
              <p className="flex items-start gap-2 text-base font-semibold">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    topAlert.severity === "urgent" ? "text-orange-600" : "text-amber-600",
                  )}
                  aria-hidden
                />
                <span>{topAlert.title}</span>
              </p>
              <p className="text-sm text-muted-foreground">{topAlert.why}</p>
              <Button asChild variant="outline" className="mt-1 h-12 w-full">
                <Link to="/alerts">Open alerts</Link>
              </Button>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
              No open alerts. Keep logging the morning round.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <Button asChild className="mb-3 h-14 w-full text-base">
        <Link to="/record">
          <ClipboardCheck className="size-5" aria-hidden />
          {roundDone ? "Review morning round" : "Log morning round"}
        </Link>
      </Button>
      <p className="mb-6 text-center text-xs text-muted-foreground">
        Enter deaths and feed — under a minute. Optional fields can wait.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="h-12 flex-1">
          <Link to="/batches">View flocks</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 flex-1">
          <Link to="/tasks">Tasks</Link>
        </Button>
      </div>

      {farm.stockKg !== null ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Feed on hand:{" "}
          {formatFeed(farm.stockKg, farm.settings.feedUnit, farm.settings.defaultBagKg)}
        </p>
      ) : null}
    </div>
  )
}

function DashboardEmptyState() {
  const farm = useFarm()
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        eyebrow={farm.settings.location || "Your farm"}
        title="Today"
        description="No flock yet — add one to see status."
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Bird className="size-6" aria-hidden />
          </span>
          <div className="max-w-md space-y-1.5">
            <p className="text-base font-bold tracking-tight">Create your first flock</p>
            <p className="text-sm text-muted-foreground">
              Add a flock (batch) to track deaths, feed, and status. Until then, Today stays empty.
            </p>
          </div>
          <Button asChild className="h-14 px-6 text-base">
            <Link to="/batches/placement">Create first flock</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
