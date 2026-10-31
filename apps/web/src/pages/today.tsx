import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Bird,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  HeartPulse,
  RefreshCw,
  Scale,
  Sparkles,
  Wheat,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BarTrend } from "@/components/farm/charts"
import { ColorStat, Meter } from "@/components/farm/color"
import { PageHeader } from "@/components/farm/chrome"
import { canSeeFinance, sum } from "@/domain/calc"
import { financeOf } from "@/domain/finance"
import { formatDay, formatFeed, formatInr, formatNumber, isoOffset, showCount } from "@/domain/format"
import { pendingSyncCount, useFarm } from "@/store/farm-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const rowTones = [
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
]

const healthTone: Record<string, string> = {
  Good: "text-emerald-600",
  Watch: "text-amber-600",
  "At risk": "text-orange-600",
}

function taskMark(severity: string) {
  if (severity === "urgent") {
    return { label: "At risk", level: "High", labelClass: "text-orange-600", levelClass: "text-orange-500" }
  }
  if (severity === "due") {
    return { label: "Due", level: "Medium", labelClass: "text-amber-600", levelClass: "text-amber-500" }
  }
  if (severity === "attention") {
    return { label: "Watch", level: "Medium", labelClass: "text-amber-600", levelClass: "text-amber-500" }
  }
  return { label: "Open", level: "", labelClass: "text-muted-foreground", levelClass: "text-muted-foreground" }
}

export function TodayPage() {
  const farm = useFarm()
  if (!farm.batch || farm.state.batches.length === 0) {
    return <DashboardEmptyState />
  }
  const finance = financeOf(farm.state)
  const openTasks = farm.tasks.filter((task) => task.status !== "resolved")
  const openAlerts = farm.alerts.filter((alert) => alert.status !== "resolved")
  const atRisk =
    openAlerts.filter((alert) => alert.severity === "urgent").length +
    openTasks.filter((task) => task.severity === "urgent").length +
    (farm.runwayDays !== null && farm.runwayDays < 7 ? 1 : 0)
  const score =
    farm.completeness.expected === 0
      ? null
      : Math.round((farm.completeness.recorded / farm.completeness.expected) * 100)
  const health =
    (farm.runwayDays !== null && farm.runwayDays < 3) ||
    (farm.todayMortality !== null && farm.todayMortality > 15)
      ? "At risk"
      : score !== null && score >= 70
        ? "Good"
        : "Watch"
  const roundLabel = !farm.todayRound ? "Not started" : farm.todayRound.draft ? "Draft" : "Recorded"
  const runway = farm.runwayDays === null ? "Unknown" : `${formatNumber(farm.runwayDays, 1)} days`
  const pending = pendingSyncCount(farm.state)

  const trendDays = [-6, -5, -4, -3, -2, -1, 0].map((offset) => isoOffset(offset))
  const trend = trendDays.map((date) => ({
    date,
    water: sum(
      farm.state.water
        .filter((record) => record.batchId === farm.batch?.id && record.date === date)
        .map((record) => record.litres),
    ),
    feed: sum(
      farm.state.feed
        .filter(
          (movement) =>
            movement.batchId === farm.batch?.id && movement.reason === "issued" && movement.date === date,
        )
        .map((movement) => movement.kg),
    ),
  }))

  const topAlert = openAlerts.find((alert) => alert.severity === "urgent") ?? openAlerts[0]

  const activity = [
    ...farm.state.rounds.map((item) => ({
      id: item.id,
      date: item.date,
      sync: item.sync,
      label: item.draft ? "Daily round started" : "Daily round recorded",
    })),
    ...farm.state.mortality.map((item) => ({
      id: item.id,
      date: item.date,
      sync: item.sync,
      label: `Mortality recorded · ${showCount(item.count, "birds")}`,
    })),
    ...farm.state.feed
      .filter((item) => item.reason !== "opening")
      .map((item) => ({
        id: item.id,
        date: item.date,
        sync: item.sync,
        label: `Feed stock updated · ${formatNumber(item.kg)} kg`,
      })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)

  return (
    <div>
      {pending > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e7c98e] bg-[#fff8e9] px-4 py-3 text-[#805514]">
          <CloudOff className="size-4 shrink-0" />
          <p className="flex-1 text-sm">
            <span className="font-semibold text-[#64400b]">{pending} {pending === 1 ? "record" : "records"}</span>{" "}
            saved locally. Nothing has reached a server in this demo.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#087f73]"
            onClick={() => {
              farm.dispatch({ type: "sync-now" })
              toast.success("Marked synced in this demo. Nothing was sent to a server.")
            }}
          >
            <RefreshCw className="size-3.5" />
            Sync now
          </button>
        </div>
      ) : null}

      <PageHeader
        eyebrow={farm.settings.location}
        title="What needs you now"
        description={`${farm.batch?.code ?? "No open batch"} · ${farm.batch?.breed ?? "Breed not set"}.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="min-h-[8.25rem] rounded-[13px] border border-t-[3px] border-border bg-card px-4 py-3.5 shadow-[0_7px_20px_rgba(33,61,46,0.045)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(33,61,46,0.10)]" style={{ borderTopColor: health === "Good" ? "#0e9a6e" : health === "Watch" ? "#d99735" : "#d9733a" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Flock health</p>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-[9px]",
                health === "Good" && "bg-[#e5f5ef] text-[#0e9a6e]",
                health === "Watch" && "bg-[#fff3df] text-[#b8670b]",
                health === "At risk" && "bg-orange-50 text-orange-600",
              )}
            >
              <HeartPulse className="size-3.5" />
            </span>
          </div>
          <p className={cn("mt-4 text-[1.7rem] leading-none font-bold tracking-tight", healthTone[health])}>
            {health}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {score === null ? (
              "No fields expected yet."
            ) : (
              <>
                <span className={cn("font-bold", healthTone[health])}>{score}</span>
                <span className="font-semibold">/100</span> record coverage this week.
              </>
            )}
          </p>
          <div className="mt-3">
            <Meter
              value={score ?? 0}
              tone={health === "Good" ? "good" : health === "Watch" ? "warn" : "alert"}
            />
          </div>
        </div>
        <ColorStat label="Live birds" value={formatNumber(farm.live)} hint={`Day ${farm.day} of this batch.`} icon={Bird} swatch="blue" />
        <ColorStat label="Your turn" value={String(openTasks.length)} hint="Open tasks waiting on this farm." icon={ClipboardCheck} swatch="purple" />
        <ColorStat
          label="At risk"
          value={String(atRisk)}
          hint="Urgent work, plus a short feed runway."
          tone={atRisk > 0 ? "alert" : "default"}
          icon={AlertTriangle}
          swatch="amber"
        />
        <ColorStat
          label="Recorded today"
          value={roundLabel}
          hint={
            farm.todayMortality === null
              ? "Mortality not recorded."
              : `${showCount(farm.todayMortality, "dead")} counted.`
          }
          tone={roundLabel === "Recorded" ? "good" : "default"}
          icon={CheckCircle2}
          swatch="teal"
        />
      </section>

      <section className="mt-5 grid items-start gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.9fr)]">
        <Card className="rounded-[13px] shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
          <CardContent className="space-y-2">
            <div className="pb-1">
              <p className="text-sm font-bold">Your turn</p>
              <p className="text-xs text-muted-foreground">Open work on this batch.</p>
            </div>
            {openTasks.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              openTasks.slice(0, 5).map((task, index) => {
                const mark = taskMark(task.severity)
                const borderColor =
                  task.severity === "urgent" ? "#df8a34" : task.severity === "due" ? "#4c9e9a" : "#8d6abb"
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-[10px] border border-border py-3 pr-3 pl-3.5 transition-all hover:translate-x-[3px] hover:shadow-[0_8px_22px_rgba(33,61,46,0.09)]"
                    style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
                        rowTones[index % rowTones.length],
                      )}
                    >
                      <ClipboardCheck className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{task.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="flex items-center justify-end gap-2 text-xs font-semibold">
                        <span className={mark.labelClass}>{mark.label}</span>
                        {mark.level ? <span className={mark.levelClass}>{mark.level}</span> : null}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDay(task.due)}</p>
                    </div>
                  </div>
                )
              })
            )}
            <Button variant="ghost" asChild className="h-8 px-0 text-muted-foreground">
              <Link to="/tasks">View all tasks</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <SideQueue
            title="At risk"
            count={openAlerts.length}
            hint="Alerts still open on this farm."
            tone={openAlerts.length > 0 ? "alert" : "default"}
          >
            {openAlerts.slice(0, 3).map((alert) => (
              <p key={alert.id} className={cn("text-sm font-medium", alert.severity === "urgent" && "text-orange-700")}>
                {alert.title}
              </p>
            ))}
            {openAlerts.length === 0 ? <p className="text-sm text-muted-foreground">Nothing open.</p> : null}
          </SideQueue>
          <SideQueue title="Feed runway" count={runway} hint={farm.recentUseKg === null ? "Not enough confirmed use." : `${formatFeed(farm.stockKg, farm.settings.feedUnit, farm.settings.defaultBagKg)} on hand.`} tone={farm.runwayDays !== null && farm.runwayDays < 7 ? "alert" : "default"}>
            <p className="text-sm text-muted-foreground">
              {farm.recentUseKg === null
                ? "A runway stays unknown until three confirmed use days exist."
                : `${formatFeed(farm.recentUseKg, farm.settings.feedUnit, farm.settings.defaultBagKg)} recent daily use.`}
            </p>
          </SideQueue>
          <SideQueue title="Today's round" count={roundLabel} hint={`${farm.completeness.recorded}/${farm.completeness.expected} fields in 7 days.`}>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bird className="size-3.5" />
              {showCount(farm.todayMortality, "dead")}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wheat className="size-3.5" />
              {farm.stockKg === null ? "Stock unknown" : `${formatFeed(farm.stockKg, farm.settings.feedUnit, farm.settings.defaultBagKg)} stock`}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="size-3.5" />
              {farm.latestWeight === null ? "Weight not recorded" : `${formatNumber(farm.latestWeight)} g latest sample`}
            </p>
          </SideQueue>
        </div>
      </section>

      <section className="mt-4 grid items-start gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
        <Card className="rounded-[13px] shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-bold">Water &amp; feed usage</p>
              <p className="text-xs text-muted-foreground">Last 7 days, this batch.</p>
            </div>
            <BarTrend
              data={trend}
              series={[
                { key: "water", label: "Water (L)", from: "#69b8a8", to: "#328b80" },
                { key: "feed", label: "Feed (kg)", from: "#f0bf76", to: "#d08a35" },
              ]}
            />
            {trend.every((day) => day.water === 0 && day.feed === 0) ? (
              <p className="text-xs text-muted-foreground">No water or feed confirmed in the last 7 days.</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <Card className="rounded-[13px] border-[#cde6d6] bg-gradient-to-br from-[#e8f5ee] to-[#f7fbf8] shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex size-7 items-center justify-center rounded-[9px] bg-[#d9eedc] text-[#4f9569]">
                  <Sparkles className="size-3.5" />
                </span>
              </div>
              <p className="text-base leading-snug font-semibold text-[#17231f]">
                {topAlert ? topAlert.title : "No open alerts right now."}
              </p>
              <p className="text-xs leading-relaxed text-[#657b6b]">
                {topAlert ? topAlert.why : "Keep recording daily rounds to catch risks early."}
              </p>
              {topAlert ? (
                <Link
                  to="/alerts"
                  className="inline-block border-t border-[#d8e6da] pt-2.5 text-xs font-semibold text-[#087f73]"
                >
                  View alert
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[13px] shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
            <CardContent className="space-y-1">
              <p className="pb-1 text-sm font-bold">Recent activity</p>
              {activity.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">Nothing recorded yet.</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 border-t py-2.5 first:border-t-0">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-[8px]",
                        item.sync === "synced" ? "bg-[#edf4ef] text-[#477259]" : "bg-[#fff3df] text-[#b8670b]",
                      )}
                    >
                      {item.sync === "synced" ? <Wifi className="size-3.5" /> : <CloudOff className="size-3.5" />}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs text-foreground">{item.label}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{formatDay(item.date)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <p className="mt-4 rounded-[13px] border border-border bg-card px-4 py-3.5 text-sm text-muted-foreground shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
        {canSeeFinance(farm.role) ? (
          <>
            Recorded cost <span className="font-semibold text-foreground">{formatInr(finance.recordedCost)}</span>.
            Supplier due <span className="font-semibold text-orange-600">{formatInr(finance.supplierDue)}</span>.
            Estimated net <span className="font-semibold text-foreground">{formatInr(finance.estimatedNet)}</span>, partial until this batch has a sale.
          </>
        ) : (
          <>Money stays with the owner. This view shows birds, feed, and tasks only.</>
        )}
      </p>
    </div>
  )
}

function SideQueue({
  title,
  count,
  hint,
  tone = "default",
  children,
}: {
  title: string
  count: string | number
  hint: string
  tone?: "default" | "alert"
  children: ReactNode
}) {
  return (
    <Card className="rounded-[13px] shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-bold">{title}</p>
          <p className={cn("text-sm font-bold tabular-nums", tone === "alert" ? "text-orange-600" : "text-muted-foreground")}>{count}</p>
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <div className="space-y-1.5 pt-1">{children}</div>
      </CardContent>
    </Card>
  )
}

function DashboardEmptyState() {
  const farm = useFarm()
  return (
    <div>
      <PageHeader
        eyebrow={farm.settings.location || "Your farm"}
        title="What needs you now"
        description="No batch yet · breed not recorded."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ColorStat label="Live birds" value={showCount(null)} hint="No batch recorded yet." icon={Bird} swatch="blue" />
        <ColorStat label="Recorded today" value={showCount(null)} hint="Mortality not recorded." icon={CheckCircle2} swatch="teal" />
        <ColorStat label="Your turn" value={String(farm.tasks.filter((task) => task.status !== "resolved").length)} hint="Open tasks waiting on this farm." icon={ClipboardCheck} swatch="purple" />
        <ColorStat label="At risk" value={showCount(null)} hint="No flock data to assess yet." icon={AlertTriangle} swatch="amber" />
      </section>
      <Card className="mt-5 rounded-[13px] shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e5f5ef] text-[#0e9a6e]">
            <Bird className="size-6" />
          </span>
          <div className="max-w-md space-y-1.5">
            <p className="text-base font-bold tracking-tight">Create your first batch</p>
            <p className="text-sm text-muted-foreground">
              Your farm is set up, but there is no flock recorded yet. Add a batch to start
              tracking mortality, feed, and water. Flock values stay Not recorded until then.
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-full bg-primary text-primary-foreground shadow-[0_7px_16px_rgba(8,127,115,0.18)] hover:bg-primary/90"
          >
            <Link to="/batches/placement">Create your first batch</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
