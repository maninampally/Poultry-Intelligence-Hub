import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Fact, PageHeader, StatusPill } from "@/components/farm/chrome"
import { canSeeFinance } from "@/domain/calc"
import { formatDay, formatInr, formatNumber, todayISO } from "@/domain/format"
import type { FeedReason } from "@/domain/types"
import { newId, useFarm } from "@/store/farm-store"

const feedReasons: { value: FeedReason; label: string; direction: 1 | -1 }[] = [
  { value: "received", label: "Received", direction: 1 },
  { value: "issued", label: "Issued for birds", direction: -1 },
  { value: "returned", label: "Returned", direction: 1 },
  { value: "spill", label: "Spill", direction: -1 },
  { value: "pest", label: "Pest damage", direction: -1 },
  { value: "moisture", label: "Moisture damage", direction: -1 },
  { value: "expired", label: "Expired", direction: -1 },
  { value: "adjustment", label: "Physical count adjustment", direction: -1 },
]

export function MortalityPage() {
  const farm = useFarm()
  const [count, setCount] = useState("")
  const [cause, setCause] = useState("Not classified")
  const [error, setError] = useState("")
  const events = farm.mortality
    .filter((event) => event.batchId === farm.batch?.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  function add() {
    const parsed = z.coerce.number().int().min(0).safeParse(count)
    if (!parsed.success || !farm.batch) {
      setError("Enter a whole number. Use 0 only if you counted none.")
      return
    }
    farm.dispatch({
      type: "add-mortality",
      event: {
        id: newId("mort"),
        batchId: farm.batch.id,
        date: todayISO(),
        shedId: farm.sheds[0]?.id ?? "",
        count: parsed.data,
        cause,
        sync: "saved-locally",
      },
    })
    setCount("")
    setError("")
    toast.success("Mortality saved locally.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Mortality and bird balance"
        description="Live birds follow the ledger. A missing day is not treated as zero."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <FactCard label="Live birds" value={formatNumber(farm.live)} />
        <FactCard label="Mortality" value={formatNumber(farm.mortalityTotal)} />
        <FactCard label="Culls" value={formatNumber(farm.cullTotal)} />
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>How the balance is built</CardTitle>
        </CardHeader>
        <CardContent>
          <Fact label="Placed" value={formatNumber(farm.batch?.placed ?? 0)} />
          <Fact label="Transfers in" value={formatNumber(farm.transfersIn)} />
          <Fact label="Mortality" value={formatNumber(farm.mortalityTotal)} />
          <Fact label="Culls" value={formatNumber(farm.cullTotal)} />
          <Fact label="Dispatched" value={formatNumber(farm.dispatched)} />
          <Fact label="Transfers out" value={formatNumber(farm.transfersOut)} />
          <Fact label="Live birds" value={formatNumber(farm.live)} />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Quick entry</CardTitle>
            <CardDescription>Adds a fact. It does not erase an earlier count.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label htmlFor="mort-count">Birds</Label>
            <Input id="mort-count" className="h-12 text-lg" inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} />
            <Label htmlFor="mort-cause">Cause, if known</Label>
            <Input id="mort-cause" className="h-11" value={cause} onChange={(event) => setCause(event.target.value)} />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="h-11" onClick={add}>Save count</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Cause</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{formatDay(event.date)}</TableCell>
                    <TableCell className="tabular-nums">{event.count}</TableCell>
                    <TableCell>{event.cause}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function FeedPage() {
  const farm = useFarm()
  const [kg, setKg] = useState("")
  const [reason, setReason] = useState<FeedReason>("issued")
  const [error, setError] = useState("")
  const owner = canSeeFinance(farm.role)
  const runway = farm.runwayDays === null ? "Unknown" : `${formatNumber(farm.runwayDays, 1)} days`
  const movements = farm.feed.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)

  function add() {
    const parsed = z.coerce.number().positive().safeParse(kg)
    const chosen = feedReasons.find((item) => item.value === reason)
    if (!parsed.success || !chosen) {
      setError("Enter a quantity above zero.")
      return
    }
    farm.dispatch({
      type: "add-feed",
      movement: {
        id: newId("feed"),
        date: todayISO(),
        reason,
        kg: parsed.data,
        direction: chosen.direction,
        batchId: reason === "received" ? null : farm.batch?.id ?? null,
        shedId: farm.sheds[0]?.id ?? null,
        note: "Entered on Feed & Inventory",
        unitCostPaise: null,
        sync: "saved-locally",
      },
    })
    setKg("")
    setError("")
    toast.success("Feed movement saved locally. Stock is recalculated.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Feed and inventory"
        description="Stock is the sum of movements. A purchase plan does not change it."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <FactCard label="Recorded stock" value={`${formatNumber(farm.stockKg)} kg`} />
        <FactCard label="Feed runway" value={runway} />
        <FactCard
          label="Recent daily use"
          value={farm.recentUseKg === null ? "Unknown" : `${formatNumber(farm.recentUseKg)} kg`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New movement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as FeedReason)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedReasons.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="feed-kg">Kilograms</Label>
            <Input id="feed-kg" className="h-12 text-lg" inputMode="decimal" value={kg} onChange={(event) => setKg(event.target.value)} />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="h-11" onClick={add}>Save movement</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent movements</CardTitle>
            <CardDescription>
              Performance feed is issued minus returns. Runway ignores days with no use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Kg</TableHead>
                  {owner ? <TableHead>Cost note</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDay(movement.date)}</TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell className="tabular-nums">
                      {movement.direction < 0 ? "−" : "+"}
                      {formatNumber(movement.kg)}
                    </TableCell>
                    {owner ? (
                      <TableCell>
                        {movement.unitCostPaise ? formatInr(movement.unitCostPaise) + "/kg" : "—"}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function WaterPage() {
  const farm = useFarm()
  const [litres, setLitres] = useState("")
  const [leak, setLeak] = useState("None seen")
  const [litter, setLitter] = useState("Dry")
  const [error, setError] = useState("")
  const records = farm.water
    .filter((record) => record.batchId === farm.batch?.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  function add() {
    const parsed = z.coerce.number().min(0).safeParse(litres)
    if (!parsed.success || !farm.batch) {
      setError("Enter litres, or 0 if none was used.")
      return
    }
    farm.dispatch({
      type: "add-water",
      record: {
        id: newId("water"),
        batchId: farm.batch.id,
        date: todayISO(),
        shedId: farm.sheds[0]?.id ?? "",
        litres: parsed.data,
        source: "Borewell",
        supply: "Recorded",
        leak,
        litter,
        note: "",
        sync: "saved-locally",
      },
    })
    setLitres("")
    setError("")
    toast.success("Water record saved locally.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Water and environment"
        description="Consumption, supply, leaks, and litter. These notes explain performance. They do not diagnose disease."
      />
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Today’s water</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label htmlFor="litres">Litres</Label>
            <Input id="litres" className="h-12 text-lg" inputMode="decimal" value={litres} onChange={(event) => setLitres(event.target.value)} />
            <Label htmlFor="leak">Leak</Label>
            <Input id="leak" className="h-11" value={leak} onChange={(event) => setLeak(event.target.value)} />
            <Label>Litter</Label>
            <Select value={litter} onValueChange={setLitter}>
              <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Dry", "Damp", "Wet", "Caked"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="h-11" onClick={add}>Save water record</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Litres</TableHead>
                  <TableHead>Leak</TableHead>
                  <TableHead>Litter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDay(record.date)}</TableCell>
                    <TableCell className="tabular-nums">{formatNumber(record.litres)}</TableCell>
                    <TableCell>{record.leak || "—"}</TableCell>
                    <TableCell>{record.litter}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function WeightPage() {
  const farm = useFarm()
  const [sampleSize, setSampleSize] = useState("")
  const [average, setAverage] = useState("")
  const [zones, setZones] = useState("front, middle, back")
  const [error, setError] = useState("")

  function add() {
    const size = z.coerce.number().int().positive().safeParse(sampleSize)
    const grams = z.coerce.number().positive().safeParse(average)
    if (!size.success || !grams.success || !farm.batch) {
      setError("Enter a sample size and an average weight in grams.")
      return
    }
    farm.dispatch({
      type: "add-weight",
      sample: {
        id: newId("weight"),
        batchId: farm.batch.id,
        date: todayISO(),
        shedId: farm.sheds[0]?.id ?? "",
        sampleSize: size.data,
        totalGrams: Math.round(size.data * grams.data),
        zones,
        method: "Random catch",
        scale: "Hanging 5 kg",
        note: "",
        sync: "saved-locally",
      },
    })
    setSampleSize("")
    setAverage("")
    setError("")
    toast.success("Weight sample saved locally.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Weight and performance"
        description="FCR uses confirmed feed and the latest sample. It is an estimate when days are missing."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <FactCard
          label="Latest average"
          value={farm.latestWeight === null ? "Not recorded" : `${formatNumber(farm.latestWeight)} g`}
        />
        <FactCard label="Sample quality" value={farm.quality} />
        <FactCard label="Estimated FCR" value={farm.fcr === null ? "Unknown" : formatNumber(farm.fcr, 2)} />
      </div>
      <Card className="mb-4">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Record coverage is {farm.weightCoverage}. Previous sample{" "}
          {farm.previousWeight === null ? "is not recorded" : `averaged ${formatNumber(farm.previousWeight)} g`}.
          Basis: confirmed feed ÷ (live birds × latest average weight).
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>New sample</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="sample-size">Sample size</Label>
            <Input id="sample-size" className="h-12" inputMode="numeric" value={sampleSize} onChange={(event) => setSampleSize(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="avg-g">Average grams</Label>
            <Input id="avg-g" className="h-12" inputMode="decimal" value={average} onChange={(event) => setAverage(event.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="zones">Zones sampled</Label>
            <Input id="zones" className="h-11" value={zones} onChange={(event) => setZones(event.target.value)} />
          </div>
          {error ? <p className="text-xs text-destructive sm:col-span-2">{error}</p> : null}
          <Button className="h-11 sm:col-span-2 sm:w-fit" onClick={add}>Save sample</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function HealthPage() {
  const farm = useFarm()
  const [signs, setSigns] = useState("")
  const [error, setError] = useState("")
  const observations = farm.health.filter((item) => item.batchId === farm.batch?.id)

  function addObservation() {
    const parsed = z.string().trim().min(3).safeParse(signs)
    if (!parsed.success || !farm.batch) {
      setError("Describe what you saw. Do not enter a diagnosis or a dose.")
      return
    }
    farm.dispatch({
      type: "add-health",
      record: {
        id: newId("health"),
        batchId: farm.batch.id,
        date: todayISO(),
        shedId: farm.sheds[0]?.id ?? "",
        signs: parsed.data,
        note: "User-entered observation.",
        sync: "saved-locally",
      },
    })
    setSigns("")
    setError("")
    toast.success("Observation saved. It is not a diagnosis.")
  }

  function markGiven(id: string) {
    const event = farm.vaccinations.find((item) => item.id === id)
    if (!event) return
    farm.dispatch({
      type: "add-vaccination",
      record: { ...event, givenOn: todayISO(), administrator: "Recorded on farm", sync: "saved-locally" },
    })
    toast.success("Vaccination recorded.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Health and vaccination"
        description="Record signs and scheduled work. The product does not diagnose disease or recommend medicine."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Observation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea value={signs} onChange={(event) => setSigns(event.target.value)} placeholder="What did you see?" />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="h-11" onClick={addObservation}>Save observation</Button>
            <div className="space-y-2 text-sm">
              {observations.map((item) => (
                <p key={item.id}>
                  <span className="text-muted-foreground">{formatDay(item.date)} · </span>
                  {item.signs}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vaccination schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {farm.vaccinations
              .filter((item) => item.batchId === farm.batch?.id)
              .map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.name}</p>
                    <StatusPill tone={item.givenOn ? "good" : "warn"}>
                      {item.givenOn ? "Given" : "Due"}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Due {formatDay(item.dueOn)}
                    {item.givenOn ? ` · given ${formatDay(item.givenOn)}` : ""}
                    {item.lot ? ` · lot ${item.lot}` : ""}
                  </p>
                  {!item.givenOn ? (
                    <Button variant="outline" className="mt-2 h-10" onClick={() => markGiven(item.id)}>
                      Mark given today
                    </Button>
                  ) : null}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function BiosecurityPage() {
  const farm = useFarm()
  const [footwear, setFootwear] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [removal, setRemoval] = useState(false)
  const [waterline, setWaterline] = useState(false)
  const [visitor, setVisitor] = useState("")
  const [purpose, setPurpose] = useState("")

  function saveRound() {
    farm.dispatch({
      type: "add-biosecurity",
      record: {
        id: newId("bio"),
        date: todayISO(),
        shedId: farm.sheds[0]?.id ?? "",
        footwear,
        cleaning,
        mortalityRemoval: removal,
        waterline,
        note: "",
        sync: "saved-locally",
      },
    })
    toast.success("Biosecurity round saved locally.")
  }

  function saveVisitor() {
    const parsed = z.object({
      visitor: z.string().trim().min(2),
      purpose: z.string().trim().min(2),
    }).safeParse({ visitor, purpose })
    if (!parsed.success) {
      toast.error("Enter a name and a purpose.")
      return
    }
    farm.dispatch({
      type: "add-visitor",
      record: {
        id: newId("visit"),
        date: todayISO(),
        name: parsed.data.visitor,
        purpose: parsed.data.purpose,
        vehicle: "",
      },
    })
    setVisitor("")
    setPurpose("")
    toast.success("Visitor saved.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Biosecurity"
        description="Checklist and visitor log. Unchecked items stay visible."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today’s checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Check label="Footwear / PPE" checked={footwear} onChange={setFootwear} />
            <Check label="Cleaning done" checked={cleaning} onChange={setCleaning} />
            <Check label="Mortality removed" checked={removal} onChange={setRemoval} />
            <Check label="Waterline checked" checked={waterline} onChange={setWaterline} />
            <Button className="h-11" onClick={saveRound}>Save checklist</Button>
            <div className="space-y-2 text-sm">
              {farm.biosecurity.map((round) => (
                <p key={round.id}>
                  {formatDay(round.date)} · waterline {round.waterline ? "checked" : "not checked"}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Visitor log</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input className="h-11" placeholder="Name" value={visitor} onChange={(event) => setVisitor(event.target.value)} />
            <Input className="h-11" placeholder="Purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            <Button className="h-11" onClick={saveVisitor}>Save visitor</Button>
            {farm.visitors.map((entry) => (
              <p key={entry.id} className="text-sm">
                {formatDay(entry.date)} · {entry.name} · {entry.purpose}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function MaintenancePage() {
  const farm = useFarm()
  const [issue, setIssue] = useState("")

  function add() {
    const parsed = z.string().trim().min(3).safeParse(issue)
    const asset = farm.assets[0]
    if (!parsed.success || !asset) {
      toast.error("Describe the issue.")
      return
    }
    farm.dispatch({
      type: "add-maintenance",
      record: {
        id: newId("maint"),
        assetId: asset.id,
        date: todayISO(),
        issue: parsed.data,
        status: "open",
        note: "",
        sync: "saved-locally",
      },
    })
    setIssue("")
    toast.success("Maintenance issue saved.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Maintenance and assets"
        description="Equipment problems become tasks before they become flock problems."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {farm.assets.map((asset) => {
              const shed = farm.sheds.find((item) => item.id === asset.shedId)
              return (
                <div key={asset.id} className="rounded-lg border p-3">
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {shed?.name ?? "Farm"} · {asset.condition} · service {formatDay(asset.nextService)}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open issues</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {farm.maintenance.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p>{event.issue}</p>
                  <p className="text-muted-foreground">{formatDay(event.date)}</p>
                </div>
                <StatusPill tone={event.status === "open" ? "warn" : "good"}>{event.status}</StatusPill>
              </div>
            ))}
            <Label htmlFor="issue">New issue</Label>
            <Input id="issue" className="h-11" value={issue} onChange={(event) => setIssue(event.target.value)} />
            <Button className="h-11" onClick={add}>Save issue</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-display text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-lg border px-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
