import { useState } from "react"
import {
  AlertTriangle,
  Bird,
  CheckCircle2,
  Droplets,
  Gauge,
  HeartPulse,
  History,
  Layers,
  Scale,
  Scissors,
  Shield,
  Skull,
  Syringe,
  TrendingUp,
  Users,
  Wheat,
  Wrench,
} from "lucide-react"
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
import { BarTrend, GrowthCurve } from "@/components/farm/charts"
import { ColorStat, Meter } from "@/components/farm/color"
import { Fact, PageHeader, StatusPill } from "@/components/farm/chrome"
import { averageGrams, canSeeFinance, sum } from "@/domain/calc"
import { standardCurveUpTo } from "@/domain/breed-standard"
import { batchDay, formatDay, formatFeed, formatInr, formatNumber, isoOffset, todayISO } from "@/domain/format"
import { toCanonical } from "@/domain/units"
import { cn } from "@/lib/utils"
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
        <ColorStat label="Live birds" value={formatNumber(farm.live)} hint="Placed plus transfers in, minus losses." tone="good" swatch="teal" icon={Bird} />
        <ColorStat label="Mortality" value={formatNumber(farm.mortalityTotal)} hint={farm.todayMortality === null ? "Today is not recorded." : `${formatNumber(farm.todayMortality)} counted today.`} tone={farm.mortalityTotal > 0 ? "alert" : "default"} swatch="rose" icon={Skull} />
        <ColorStat label="Culls" value={formatNumber(farm.cullTotal)} hint="Removed on purpose. Separate from deaths." tone="warn" swatch="amber" icon={Scissors} />
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Daily mortality</CardTitle>
          <CardDescription>Last 14 days, this batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarTrend
            data={Array.from({ length: 14 }, (_, index) => isoOffset(index - 13)).map((date) => ({
              date,
              count: sum(events.filter((event) => event.date === date).map((event) => event.count)),
            }))}
            series={[{ key: "count", label: "Mortality", from: "#e1849e", to: "#c23c5f" }]}
            unit=" birds"
          />
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
                    <TableCell className="font-bold tabular-nums text-rose-700">{event.count}</TableCell>
                    <TableCell className="font-medium">{event.cause}</TableCell>
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
  const settings = farm.settings
  const [unit, setUnit] = useState<"kg" | "bags">(settings.feedUnit)
  const [qty, setQty] = useState("")
  const [bagSize, setBagSize] = useState(settings.defaultBagKg === null ? "" : String(settings.defaultBagKg))
  const [reason, setReason] = useState<FeedReason>("issued")
  const [error, setError] = useState("")
  const [bagError, setBagError] = useState("")
  const owner = canSeeFinance(farm.role)
  const runway = farm.runwayDays === null ? "Unknown" : `${formatNumber(farm.runwayDays, 1)} days`
  const movements = farm.feed.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)

  const qtyNum = Number(qty)
  const bagNum = Number(bagSize)
  const livePreviewKg =
    unit === "bags" && qty.trim() !== "" && Number.isFinite(qtyNum) && Number.isFinite(bagNum) && bagNum > 0
      ? qtyNum * bagNum
      : null
  const amountLabel = unit === "bags" ? "Bags" : "Kilograms"

  function add() {
    const chosen = feedReasons.find((item) => item.value === reason)
    const qtyResult = z.coerce.number().positive().safeParse(qty)
    if (!qtyResult.success || !chosen) {
      setError("Enter a quantity above zero.")
      return
    }
    let canonicalKg: number
    if (unit === "bags") {
      const bagResult = z.coerce.number().positive().safeParse(bagSize)
      if (!bagResult.success) {
        setBagError("Enter a bag size in kg above zero.")
        setError("")
        return
      }
      canonicalKg = toCanonical(qtyResult.data, "bags", "mass", { bagSizeKg: bagResult.data })
    } else {
      canonicalKg = qtyResult.data
    }
    farm.dispatch({
      type: "add-feed",
      movement: {
        id: newId("feed"),
        date: todayISO(),
        reason,
        kg: canonicalKg,
        direction: chosen.direction,
        batchId: reason === "received" ? null : farm.batch?.id ?? null,
        shedId: farm.sheds[0]?.id ?? null,
        note: "Entered on Feed & Inventory",
        unitCostPaise: null,
        sync: "saved-locally",
        enteredUnit: unit,
        enteredValue: qtyResult.data,
        ...(unit === "bags" ? { bagSizeKg: Number(bagSize) } : {}),
      },
    })
    setQty("")
    setError("")
    setBagError("")
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
        <ColorStat label="Recorded stock" value={formatFeed(farm.stockKg, settings.feedUnit, settings.defaultBagKg)} hint="Sum of every movement." swatch="teal" icon={Wheat} tone="good" />
        <ColorStat label="Feed runway" value={runway} hint="Stock divided by recent confirmed use." tone={farm.runwayDays !== null && farm.runwayDays < 7 ? "alert" : "default"} swatch="orange" icon={Gauge} />
        <ColorStat
          label="Recent daily use"
          value={formatFeed(farm.recentUseKg, settings.feedUnit, settings.defaultBagKg)}
          hint="Days with no use are left out."
          swatch="purple"
          icon={TrendingUp}
        />
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Daily feed issued</CardTitle>
          <CardDescription>Last 14 days, this batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarTrend
            data={Array.from({ length: 14 }, (_, index) => isoOffset(index - 13)).map((date) => ({
              date,
              kg: sum(
                farm.feed
                  .filter((item) => item.batchId === farm.batch?.id && item.reason === "issued" && item.date === date)
                  .map((item) => item.kg),
              ),
            }))}
            series={[{ key: "kg", label: "Feed issued", from: "#f0bf76", to: "#d08a35" }]}
            unit=" kg"
          />
        </CardContent>
      </Card>
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
            <Label id="feed-unit-label">Unit</Label>
            <div role="radiogroup" aria-labelledby="feed-unit-label" className="grid grid-cols-2 gap-2">
              {(["kg", "bags"] as const).map((value) => {
                const active = unit === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setUnit(value)
                      setError("")
                      setBagError("")
                    }}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition-colors",
                      active
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-foreground hover:bg-muted",
                    )}
                  >
                    {value === "kg" ? "Kilograms" : "Bags"}
                  </button>
                )
              })}
            </div>
            <Label htmlFor="feed-qty">{amountLabel}</Label>
            <div className="relative">
              <Input
                id="feed-qty"
                className="h-12 pr-14 text-lg"
                inputMode="decimal"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-label={unit === "bags" ? "Quantity in bags" : "Quantity in kilograms"}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground" aria-hidden="true">
                {unit === "bags" ? "bags" : "kg"}
              </span>
            </div>
            {unit === "bags" ? (
              <>
                <Label htmlFor="feed-bag-size">Bag size</Label>
                <div className="relative">
                  <Input
                    id="feed-bag-size"
                    className="h-12 pr-12"
                    inputMode="decimal"
                    value={bagSize}
                    onChange={(event) => setBagSize(event.target.value)}
                    aria-invalid={bagError ? true : undefined}
                    aria-describedby={bagError ? "feed-bag-size-error" : undefined}
                    aria-label="Bag size in kilograms"
                    placeholder="50"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground" aria-hidden="true">
                    kg
                  </span>
                </div>
                {bagError ? (
                  <p id="feed-bag-size-error" className="text-xs font-medium text-destructive" role="alert">
                    {bagError}
                  </p>
                ) : null}
                {livePreviewKg !== null ? (
                  <p className="text-xs text-muted-foreground">= {formatNumber(livePreviewKg, 1)} kg</p>
                ) : null}
              </>
            ) : null}
            {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : null}
            <Button className="h-12" onClick={add}>Save movement</Button>
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
                  <TableHead>Amount</TableHead>
                  {owner ? <TableHead>Cost note</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDay(movement.date)}</TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell className={movement.direction < 0 ? "font-bold tabular-nums text-orange-600" : "font-bold tabular-nums text-emerald-600"}>
                      {movement.direction < 0 ? "−" : "+"}
                      {formatFeed(movement.kg, settings.feedUnit, settings.defaultBagKg)}
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
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ColorStat label="Latest litres" value={records[0] ? formatNumber(records[0].litres) : "Not recorded"} hint={records[0] ? formatDay(records[0].date) : "No water row yet."} swatch="blue" icon={Droplets} tone="good" />
        <ColorStat label="Leak" value={records[0]?.leak || "Not recorded"} hint="A leak note explains wet litter." tone={records[0] && records[0].leak && records[0].leak !== "None seen" ? "alert" : "good"} swatch="orange" icon={AlertTriangle} />
        <ColorStat label="Litter" value={records[0]?.litter ?? "Not recorded"} hint="Dry is the expected shed floor." tone={records[0]?.litter === "Dry" || !records[0] ? "good" : "warn"} swatch="amber" icon={Layers} />
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Daily water use</CardTitle>
          <CardDescription>Last 14 days, this batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarTrend
            data={Array.from({ length: 14 }, (_, index) => isoOffset(index - 13)).map((date) => ({
              date,
              litres: sum(
                farm.water
                  .filter((record) => record.batchId === farm.batch?.id && record.date === date)
                  .map((record) => record.litres),
              ),
            }))}
            series={[{ key: "litres", label: "Water", from: "#69b8a8", to: "#328b80" }]}
            unit=" L"
          />
        </CardContent>
      </Card>
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
                    <TableCell className="font-bold tabular-nums text-sky-700">{formatNumber(record.litres)}</TableCell>
                    <TableCell className={record.leak && record.leak !== "None seen" ? "font-semibold text-orange-600" : "text-emerald-700"}>{record.leak || "—"}</TableCell>
                    <TableCell className={record.litter === "Dry" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{record.litter}</TableCell>
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
  const samples = farm.weights
    .filter((sample) => sample.batchId === farm.batch?.id)
    .map((sample) => ({ day: batchDay(farm.batch?.placedOn ?? todayISO(), sample.date), grams: averageGrams(sample) }))
    .filter((point): point is { day: number; grams: number } => point.grams !== null)
  const maxDay = Math.max(farm.day, ...samples.map((point) => point.day), 7)
  const standard = standardCurveUpTo(maxDay)

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
        <ColorStat
          label="Latest average"
          value={farm.latestWeight === null ? "Not recorded" : `${formatNumber(farm.latestWeight)} g`}
          hint={farm.previousWeight === null ? "No earlier sample." : `Previous ${formatNumber(farm.previousWeight)} g.`}
          swatch="purple"
          icon={Scale}
          tone="good"
        />
        <ColorStat label="Sample quality" value={farm.quality} hint={`Weight coverage ${farm.weightCoverage}.`} tone={farm.quality === "Good" ? "good" : "warn"} swatch="amber" icon={CheckCircle2} />
        <ColorStat label="Estimated FCR" value={farm.fcr === null ? "Unknown" : formatNumber(farm.fcr, 2)} hint="Confirmed feed ÷ live birds × latest grams." swatch="blue" icon={TrendingUp} />
      </div>
      <Card className="mb-4">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Record coverage is {farm.weightCoverage}. Previous sample{" "}
          {farm.previousWeight === null ? "is not recorded" : `averaged ${formatNumber(farm.previousWeight)} g`}.
          Basis: confirmed feed ÷ (live birds × latest average weight).
        </CardContent>
      </Card>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Weight vs breed guide</CardTitle>
          <CardDescription>Recorded samples against an approximate growth curve, by batch day.</CardDescription>
        </CardHeader>
        <CardContent>
          {samples.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weight sample recorded yet for this batch.</p>
          ) : (
            <GrowthCurve samples={samples} standard={standard} />
          )}
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
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ColorStat label="Observations" value={String(observations.length)} hint="What was seen. Not a diagnosis." swatch="rose" icon={HeartPulse} tone={observations.length > 0 ? "warn" : "default"} />
        <ColorStat label="Vaccines due" value={String(farm.vaccinations.filter((item) => item.batchId === farm.batch?.id && !item.givenOn).length)} hint="Scheduled and not yet given." tone="alert" swatch="orange" icon={Syringe} />
        <ColorStat label="Vaccines given" value={String(farm.vaccinations.filter((item) => item.batchId === farm.batch?.id && item.givenOn).length)} hint="Recorded on this batch." tone="good" swatch="teal" icon={CheckCircle2} />
      </div>
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
                <p key={item.id} className="rounded-xl bg-rose-50 px-3 py-2">
                  <span className="font-semibold text-rose-700">{formatDay(item.date)}</span>
                  <span className="text-foreground"> · {item.signs}</span>
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
                <div key={item.id} className={item.givenOn ? "rounded-xl border border-emerald-200 bg-emerald-50/60 p-3" : "rounded-xl border border-amber-200 bg-amber-50/70 p-3"}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{item.name}</p>
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
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ColorStat label="Checks ready" value={`${[footwear, cleaning, removal, waterline].filter(Boolean).length}/4`} hint="This sitting, before you save." tone={[footwear, cleaning, removal, waterline].filter(Boolean).length === 4 ? "good" : "warn"} swatch="teal" icon={Shield} />
        <ColorStat label="Saved rounds" value={String(farm.biosecurity.length)} hint="Checklist history on this device." swatch="blue" icon={History} />
        <ColorStat label="Visitors" value={String(farm.visitors.length)} hint="Name and purpose stay on the log." swatch="purple" icon={Users} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today’s checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Meter
              value={[footwear, cleaning, removal, waterline].filter(Boolean).length}
              max={4}
              tone={[footwear, cleaning, removal, waterline].filter(Boolean).length === 4 ? "good" : "warn"}
              label={`${[footwear, cleaning, removal, waterline].filter(Boolean).length} of 4 checks ready`}
            />
            <Check label="Footwear / PPE" checked={footwear} onChange={setFootwear} />
            <Check label="Cleaning done" checked={cleaning} onChange={setCleaning} />
            <Check label="Mortality removed" checked={removal} onChange={setRemoval} />
            <Check label="Waterline checked" checked={waterline} onChange={setWaterline} />
            <Button className="h-11" onClick={saveRound}>Save checklist</Button>
            <div className="space-y-2 text-sm">
              {farm.biosecurity.map((round) => (
                <p key={round.id} className="rounded-xl bg-sky-50 px-3 py-2">
                  <span className="font-semibold">{formatDay(round.date)}</span>
                  <span className={round.waterline ? "text-emerald-700" : "text-orange-600"}> · waterline {round.waterline ? "checked" : "not checked"}</span>
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
              <p key={entry.id} className="rounded-xl bg-violet-50 px-3 py-2 text-sm">
                <span className="font-semibold text-violet-800">{entry.name}</span>
                <span className="text-muted-foreground"> · {formatDay(entry.date)} · {entry.purpose}</span>
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
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <ColorStat label="Assets" value={String(farm.assets.length)} hint="Equipment on this farm." swatch="blue" icon={Wrench} />
        <ColorStat label="Open issues" value={String(farm.maintenance.filter((event) => event.status === "open").length)} hint="Not closed yet." tone={farm.maintenance.some((event) => event.status === "open") ? "alert" : "good"} swatch="orange" icon={AlertTriangle} />
        <ColorStat label="Closed" value={String(farm.maintenance.filter((event) => event.status !== "open").length)} hint="Fixed, still on the record." tone="good" swatch="teal" icon={CheckCircle2} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {farm.assets.map((asset) => {
              const shed = farm.sheds.find((item) => item.id === asset.shedId)
              return (
                <div key={asset.id} className="rounded-xl border p-3">
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
