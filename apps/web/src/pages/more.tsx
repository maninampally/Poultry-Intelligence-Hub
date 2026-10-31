import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bird, ClipboardList, Factory, Skull, Sprout } from "lucide-react"
import { ColorStat } from "@/components/farm/color"
import { PageHeader, StatusPill } from "@/components/farm/chrome"
import { showCount } from "@/domain/format"
import { useFarm } from "@/store/farm-store"
import { FeedUnitField } from "@/components/farm/feed-unit-field"

export function FarmsPage() {
  const farm = useFarm()
  return (
    <div>
      <PageHeader eyebrow="More" title="Farm and sheds" description="One farm in this demo, with two sheds on the active batch." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ColorStat label="Live birds" value={farm.live.toLocaleString("en-IN")} hint={farm.settings.location} tone="good" swatch="teal" icon={Bird} />
        <ColorStat label="Sheds" value={String(farm.sheds.length)} hint="Placement allocation, not a live recount." swatch="blue" icon={Factory} />
        <ColorStat label="Placed" value={farm.sheds.reduce((sum, shed) => sum + shed.placedBirds, 0).toLocaleString("en-IN")} hint="Birds placed across sheds at the start." swatch="amber" icon={Sprout} />
      </div>
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>{farm.settings.farmName}</CardTitle>
          <CardDescription>{farm.settings.location}</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {farm.sheds.map((shed) => (
          <Card key={shed.id}>
            <CardHeader>
              <CardTitle>{shed.name}</CardTitle>
              <CardDescription>{shed.placedBirds.toLocaleString("en-IN")} birds placed at the start</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Placement allocation, not a live shed recount.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TeamPage() {
  const farm = useFarm()
  return (
    <div>
      <PageHeader
        eyebrow="More"
        title="Team"
        description="Leaving a farm deactivates access. History keeps the original name."
      />
      <div className="grid gap-3">
        {farm.team.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <StatusPill tone={member.status === "active" ? "good" : "neutral"}>{member.status}</StatusPill>
                <StatusPill>{member.role}</StatusPill>
              </div>
              <CardTitle>{member.name}</CardTitle>
              <CardDescription>
                <span className="font-semibold text-foreground">{member.shed}</span>
              </CardDescription>
            </CardHeader>
            {member.role === "worker" && member.status === "active" ? (
              <CardContent>
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    farm.dispatch({ type: "set-member-status", id: member.id, status: "inactive" })
                    toast.success("Worker marked inactive. Past records stay attributed to them.")
                  }}
                >
                  Mark inactive
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  )
}

export function SopsPage() {
  const farm = useFarm()
  return (
    <div>
      <PageHeader eyebrow="More" title="SOPs" description="Short steps for the work that happens every day." />
      <div className="grid gap-3">
        {farm.sops.map((sop) => (
          <Card key={sop.id}>
            <CardHeader>
              <CardTitle>{sop.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {sop.steps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ExportPage() {
  const farm = useFarm()
  function download() {
    const header = "date,mortality,culls,feed_kg,water_litres,draft"
    const lines = farm.rounds
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((round) =>
        [
          round.date,
          round.mortality === null ? "not recorded" : round.mortality,
          round.culls === null ? "not recorded" : round.culls,
          round.feedKg === null ? "not recorded" : round.feedKg,
          round.waterLitres === null ? "not recorded" : round.waterLitres,
          round.draft ? "draft" : "saved",
        ].join(","),
      )
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "daily-rounds.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV downloaded from the records on this device.")
  }
  return (
    <div>
      <PageHeader
        eyebrow="More"
        title="Data export"
        description="A CSV of daily rounds. Blank counts stay “not recorded” so they are not confused with zero."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <ColorStat label="Rounds on file" value={String(farm.rounds.length)} hint={farm.settings.farmName} swatch="blue" icon={ClipboardList} />
        <ColorStat label="Latest mortality" value={showCount(farm.rounds[0]?.mortality ?? null)} hint="Blank stays not recorded in the CSV." tone="alert" swatch="rose" icon={Skull} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">{farm.rounds.length} rounds</CardTitle>
          <CardDescription>Scope: {farm.settings.farmName}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="h-11" onClick={download}>Download CSV</Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Latest round mortality: {showCount(farm.rounds[0]?.mortality ?? null)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  const farm = useFarm()
  const [name, setName] = useState(farm.settings.farmName)
  const [feedUnit, setFeedUnit] = useState<"kg" | "bags">(farm.settings.feedUnit)
  const [bagSize, setBagSize] = useState(
    farm.settings.defaultBagKg === null ? "" : String(farm.settings.defaultBagKg),
  )
  const [bagError, setBagError] = useState("")

  function saveFeedUnit() {
    if (feedUnit === "bags") {
      const parsed = Number(bagSize)
      if (bagSize.trim() === "" || !Number.isFinite(parsed) || parsed <= 0) {
        setBagError("Enter a bag size in kg above zero.")
        return
      }
      setBagError("")
      farm.dispatch({ type: "update-settings", patch: { feedUnit: "bags", defaultBagKg: parsed } })
    } else {
      setBagError("")
      farm.dispatch({ type: "update-settings", patch: { feedUnit: "kg", defaultBagKg: null } })
    }
    toast.success("Feed unit saved on this device.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="More"
        title="Settings"
        description="Demo mode. Records stay in this browser until you reset them."
      />
      <Card>
        <CardContent className="grid gap-4 pt-4">
          <div className="grid gap-1.5">
            <Label htmlFor="farm-name">Farm name</Label>
            <Input id="farm-name" className="h-11" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <Button
            className="h-11 w-fit"
            onClick={() => {
              farm.dispatch({ type: "update-settings", patch: { farmName: name } })
              toast.success("Farm name saved on this device.")
            }}
          >
            Save profile
          </Button>
          <label className="flex h-11 items-center justify-between gap-3 rounded-lg border px-3 text-sm">
            Notifications
            <Switch
              checked={farm.settings.notifications}
              onCheckedChange={(checked) =>
                farm.dispatch({ type: "update-settings", patch: { notifications: checked } })
              }
            />
          </label>
          <div className="grid gap-3 border-t pt-4">
            <FeedUnitField
              idPrefix="settings"
              feedUnit={feedUnit}
              bagSize={bagSize}
              onFeedUnitChange={(unit) => {
                setFeedUnit(unit)
                setBagError("")
              }}
              onBagSizeChange={(value) => setBagSize(value)}
              bagSizeError={bagError}
            />
            <Button className="h-12 w-fit" onClick={saveFeedUnit}>
              Save feed unit
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Water is in litres and money in rupees. Dates follow India.</p>
          <Button
            variant="outline"
            className="h-11 w-fit"
            onClick={() => {
              farm.dispatch({ type: "reset" })
              toast.success("Demo farm restored.")
            }}
          >
            Reset demo data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function HelpPage() {
  return (
    <div>
      <PageHeader
        eyebrow="More"
        title="Help"
        description="The farm record is the source of truth. Everything else is calculated from it."
      />
      <div className="grid gap-3">
        {[
          ["Missing is not zero", "If a count was not entered, the screen says Not recorded.", "border-amber-300 bg-amber-50"],
          ["Corrections stay visible", "Saving a round again replaces that round’s facts and keeps the new values on the same record.", "border-sky-300 bg-sky-50"],
          ["Money is separate", "Workers and managers do not see costs. A sale does not remove birds.", "border-violet-300 bg-violet-50"],
          ["Sync is local here", "Saved locally means this browser has the record. Sync now only changes the badge in the demo.", "border-emerald-300 bg-emerald-50"],
        ].map(([title, body, tone]) => (
          <Card key={title} className={tone}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-foreground/70">{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
