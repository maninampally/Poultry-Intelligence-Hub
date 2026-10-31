import { AlertTriangle, Bell, CheckCircle2, Eye } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ColorStat, DetailBox } from "@/components/farm/color"
import { EmptyNote, PageHeader, SeverityBadge } from "@/components/farm/chrome"
import { formatNumber } from "@/domain/format"
import { useFarm } from "@/store/farm-store"
import type { Severity, WorkStatus } from "@/domain/types"
import type { Swatch } from "@/components/farm/color"
import { swatches } from "@/components/farm/color"
import { cn } from "@/lib/utils"

const alertSwatch: Record<Severity, Swatch> = {
  urgent: "orange",
  attention: "amber",
  due: "amber",
  information: "blue",
}

export function AlertsPage() {
  const farm = useFarm()
  const open = farm.alerts.filter((alert) => alert.status !== "resolved")
  const urgent = open.filter((alert) => alert.severity === "urgent").length
  const runway =
    farm.runwayDays === null
      ? "Unknown — not enough confirmed daily use."
      : `${formatNumber(farm.runwayDays, 1)} days from ${formatNumber(farm.stockKg)} kg.`

  function setStatus(id: string, status: WorkStatus) {
    farm.dispatch({ type: "set-alert-status", id, status })
    toast.success(status === "resolved" ? "Alert resolved." : "Alert updated.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title="Alerts"
        description="Each alert says what changed, why it matters, and the evidence behind it."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ColorStat label="Open" value={String(open.length)} hint="Still waiting on someone." icon={Bell} swatch="blue" />
        <ColorStat label="At risk" value={String(urgent)} hint="High severity, still open." tone={urgent > 0 ? "alert" : "good"} icon={AlertTriangle} swatch="orange" />
        <ColorStat label="Acknowledged" value={String(farm.alerts.filter((alert) => alert.status === "acknowledged").length)} hint="Seen, not closed." tone="warn" icon={Eye} swatch="amber" />
        <ColorStat label="Resolved" value={String(farm.alerts.filter((alert) => alert.status === "resolved").length)} hint="Closed, still on the record." tone="good" icon={CheckCircle2} swatch="teal" />
      </section>
      <div className="mt-4 grid gap-3">
        {farm.alerts.length === 0 ? (
          <EmptyNote>No alerts right now. Keep recording daily rounds and risks will show up here.</EmptyNote>
        ) : (
          farm.alerts.map((alert) => {
            const swatch = alertSwatch[alert.severity]
            return (
              <article key={alert.id} className="rounded-xl border bg-card p-4">
                <div className="flex gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", swatches[swatch])}>
                    <Bell className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-base font-bold tracking-tight">{alert.title}</h2>
                      <SeverityBadge severity={alert.severity} status={alert.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.why}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailBox label="Evidence" swatch={swatch}>
                        {alert.id === "alert-feed" ? runway : alert.evidence}
                      </DetailBox>
                      <DetailBox label="Coverage" swatch="blue">
                        {alert.coverage}
                      </DetailBox>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{alert.action}</p>
                    {alert.status !== "resolved" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" className="h-12" onClick={() => setStatus(alert.id, "acknowledged")}>
                          Acknowledge
                        </Button>
                        <Button className="h-12" onClick={() => setStatus(alert.id, "resolved")}>
                          Resolve
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
