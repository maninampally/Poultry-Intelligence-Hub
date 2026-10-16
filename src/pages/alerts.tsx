import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader, StatusPill } from "@/components/farm/chrome"
import { formatNumber } from "@/domain/format"
import { useFarm } from "@/store/farm-store"
import type { WorkStatus } from "@/domain/types"

const tone = {
  urgent: "bad",
  attention: "warn",
  due: "good",
  information: "neutral",
} as const

export function AlertsPage() {
  const farm = useFarm()
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
      <div className="grid gap-3">
        {farm.alerts.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={tone[alert.severity]}>{alert.severity}</StatusPill>
                <StatusPill>{alert.status}</StatusPill>
              </div>
              <CardTitle className="font-display text-2xl">{alert.title}</CardTitle>
              <CardDescription>{alert.why}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Evidence · </span>
                {alert.id === "alert-feed" ? runway : alert.evidence}
              </p>
              <p>
                <span className="text-muted-foreground">Coverage · </span>
                {alert.coverage}
              </p>
              <p className="font-medium">{alert.action}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" className="h-10" onClick={() => setStatus(alert.id, "acknowledged")}>
                  Acknowledge
                </Button>
                <Button className="h-10" onClick={() => setStatus(alert.id, "resolved")}>
                  Resolve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
