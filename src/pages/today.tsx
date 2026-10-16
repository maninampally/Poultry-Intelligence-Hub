import { Link } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Metric, PageHeader, StatusPill } from "@/components/farm/chrome"
import { canSeeFinance } from "@/domain/calc"
import { financeOf } from "@/domain/finance"
import { formatDay, formatInr, formatNumber, showCount } from "@/domain/format"
import { useFarm } from "@/store/farm-store"

export function TodayPage() {
  const farm = useFarm()
  const finance = financeOf(farm.state)
  const urgent =
    farm.alerts.find((alert) => alert.status !== "resolved" && alert.severity === "urgent") ??
    farm.tasks.find((task) => task.status !== "resolved" && task.severity === "urgent")
  const roundLabel = !farm.todayRound
    ? "Not started"
    : farm.todayRound.draft
      ? "Draft"
      : "Recorded"
  const runway =
    farm.runwayDays === null ? "Unknown" : `${formatNumber(farm.runwayDays, 1)} days`
  const openTasks = farm.tasks.filter((task) => task.status !== "resolved").slice(0, 3)
  const activity = farm.rounds
    .filter((round) => round.batchId === farm.batch?.id && !round.draft)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)

  return (
    <div>
      <PageHeader
        eyebrow={farm.settings.location}
        title="What needs you now"
        description={`${farm.batch?.code} · ${farm.batch?.breed}. Facts stay on the record. Estimates say so.`}
        action={
          <Button asChild className="h-11 px-4">
            <Link to="/record">{roundLabel === "Recorded" ? "Review today’s round" : "Start daily round"}</Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Live birds"
          value={formatNumber(farm.live)}
          hint={`Placed ${formatNumber(farm.batch?.placed ?? 0)} + transfers in − losses`}
        />
        <Metric
          label="Today’s mortality"
          value={showCount(farm.todayMortality)}
          hint={
            farm.todayMortality === null
              ? "A blank day is Not recorded, not zero."
              : farm.todayMortality === 0
                ? "Explicit zero. Someone counted and found none."
                : "Counted today. It is already in the live-bird balance."
          }
          tone={farm.todayMortality !== null && farm.todayMortality > 15 ? "alert" : "default"}
        />
        <Metric
          label="Feed runway"
          value={runway}
          hint={
            farm.recentUseKg === null
              ? "Not enough confirmed use to estimate a stock-out."
              : `${formatNumber(farm.stockKg)} kg on hand · ${formatNumber(farm.recentUseKg)} kg recent daily use`
          }
          tone={farm.runwayDays !== null && farm.runwayDays < 7 ? "alert" : "default"}
        />
        <Metric
          label="Daily round"
          value={roundLabel}
          hint={`${farm.completeness.label} coverage · ${farm.completeness.recorded}/${farm.completeness.expected} fields in 7 days`}
          tone={roundLabel === "Recorded" ? "good" : "default"}
        />
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardDescription>Most urgent</CardDescription>
            <CardTitle className="font-display text-2xl">
              {urgent && "title" in urgent ? urgent.title : "Nothing urgent is open"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {urgent && "why" in urgent ? (
              <>
                <p>{urgent.why}</p>
                <p className="text-muted-foreground">{urgent.evidence}</p>
                <p className="font-medium">{urgent.action}</p>
              </>
            ) : urgent ? (
              <p>{urgent.detail}</p>
            ) : (
              <p className="text-muted-foreground">Open alerts and tasks will land here.</p>
            )}
            <Button variant="outline" asChild className="h-10">
              <Link to="/alerts">Open alerts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardDescription>Weight and feed efficiency</CardDescription>
            <CardTitle className="font-display text-2xl tabular-nums">
              {farm.latestWeight === null ? "Not recorded" : `${formatNumber(farm.latestWeight)} g`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Sample quality <StatusPill tone={farm.quality === "Good" ? "good" : "warn"}>{farm.quality}</StatusPill>
            </p>
            <p>
              Record coverage <StatusPill>{farm.weightCoverage}</StatusPill>
            </p>
            <p>
              Estimated FCR{" "}
              <span className="font-medium tabular-nums">
                {farm.fcr === null ? "Unknown" : formatNumber(farm.fcr, 2)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Calculated from {farm.feedDays} confirmed feed days and the latest sample × live birds. Missing
              days are not filled in.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My due tasks</CardTitle>
            <CardDescription>Open work for this farm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              openTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.assignee} · {formatDay(task.due)}
                    </p>
                  </div>
                  <StatusPill tone={task.severity === "urgent" ? "bad" : "warn"}>{task.severity}</StatusPill>
                </div>
              ))
            )}
            <Button variant="ghost" asChild className="px-0">
              <Link to="/tasks">All tasks</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record completeness</CardTitle>
            <CardDescription>Mortality, feed, and water across the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress
              className="h-2"
              value={
                farm.completeness.expected === 0
                  ? 0
                  : (farm.completeness.recorded / farm.completeness.expected) * 100
              }
            />
            <p className="text-sm">
              {farm.completeness.label}. {farm.completeness.recorded} of {farm.completeness.expected} fields
              recorded.
            </p>
            <div className="space-y-1 text-sm">
              {activity.map((round) => (
                <p key={round.id} className="flex justify-between gap-3">
                  <span>{formatDay(round.date)}</span>
                  <span className="text-muted-foreground">
                    {showCount(round.mortality, "dead")} · {showCount(round.feedKg, "kg")}
                  </span>
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {canSeeFinance(farm.role) ? (
        <Alert className="mt-4">
          <AlertTitle>Owner business snapshot</AlertTitle>
          <AlertDescription>
            Recorded cost {formatInr(finance.recordedCost)}. Supplier due {formatInr(finance.supplierDue)}.
            Estimated net {formatInr(finance.estimatedNet)} — partial, because this batch has no sale yet.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mt-4">
          <AlertTitle>Costs stay hidden in this view</AlertTitle>
          <AlertDescription>
            {farm.role === "worker" ? "Shed workers" : "Managers"} can record operations. Money is visible only
            to the owner.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
