import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Bird, CalendarDays, ClipboardCheck } from "lucide-react"
import { ColorStat } from "@/components/farm/color"
import { Fact, PageHeader, StatusPill } from "@/components/farm/chrome"
import { canSeeFinance } from "@/domain/calc"
import { financeOf } from "@/domain/finance"
import { batchDay, formatDay, formatInr, formatNumber, showCount, todayISO } from "@/domain/format"
import { buildMetrics } from "@/domain/metrics"
import { newId, useFarm } from "@/store/farm-store"

export function BatchesPage() {
  const farm = useFarm()
  return (
    <div>
      <PageHeader
        eyebrow="Batches"
        title="Batches"
        description="A batch is the flock you follow from placement to closeout."
      />
      <div className="grid gap-3">
        {farm.batches.map((batch) => {
          const metrics = buildMetrics(farm.state, batch.id)
          const active = batch.id === farm.activeBatchId
          return (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={batch.status === "active" ? "good" : "neutral"}>{batch.status}</StatusPill>
                  {active ? <Badge variant="secondary">Current</Badge> : null}
                </div>
                <CardTitle className="text-base font-semibold tracking-tight">{batch.code}</CardTitle>
                <CardDescription>
                  {batch.breed} · day {batchDay(batch.placedOn)} · {batch.supplier}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                  <p>Live <span className="font-bold tabular-nums">{formatNumber(metrics.live)}</span></p>
                  <p>Placed <span className="font-semibold tabular-nums">{formatNumber(batch.placed)}</span></p>
                  <p>
                    Coverage{" "}
                    <StatusPill
                      tone={
                        metrics.completeness.label === "Complete"
                          ? "good"
                          : metrics.completeness.label === "Missing"
                            ? "bad"
                            : "warn"
                      }
                    >
                      {metrics.completeness.label}
                    </StatusPill>
                  </p>
                </div>
                <Button asChild className="h-10">
                  <Link to={`/batches/${batch.id}`}>Open batch</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function BatchDetailPage() {
  const farm = useFarm()
  const { batchId } = useParams()
  const batch = farm.batches.find((item) => item.id === batchId)
  if (!batch) {
    return (
      <PageHeader title="Batch not found" description="That batch is not on this farm." />
    )
  }
  const metrics = buildMetrics(farm.state, batch.id)
  const rounds = farm.rounds
    .filter((round) => round.batchId === batch.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
  const owner = canSeeFinance(farm.role)
  const finance = financeOf(farm.state)

  return (
    <div>
      <PageHeader
        eyebrow="Batch detail"
        title={batch.code}
        description={`${batch.breed} · placed ${formatDay(batch.placedOn)} · ${batch.status}`}
      />
      <Tabs defaultValue="overview">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          {["overview", "daily", "performance", "feed", "health", "dispatch", ...(owner ? ["finance"] : []), "timeline", "report"].map(
            (tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab === "daily" ? "Daily records" : tab === "feed" ? "Feed & water" : tab}
              </TabsTrigger>
            ),
          )}
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ColorStat label="Live birds" value={formatNumber(metrics.live)} hint={`${formatNumber(batch.placed)} placed.`} tone="good" swatch="teal" icon={Bird} />
            <ColorStat label="Day" value={String(metrics.day)} hint={`Placed ${formatDay(batch.placedOn)}.`} swatch="blue" icon={CalendarDays} />
            <ColorStat label="Record coverage" value={metrics.completeness.label} hint={`${metrics.completeness.recorded}/${metrics.completeness.expected} fields.`} tone={metrics.completeness.label === "Complete" ? "good" : metrics.completeness.label === "Missing" ? "alert" : "warn"} swatch="amber" icon={ClipboardCheck} />
          </div>
        </TabsContent>
        <TabsContent value="daily" className="pt-4">
          {rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No daily rounds for this batch.</p>
          ) : (
            rounds.map((round) => (
              <p key={round.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
                <span className="font-semibold">{formatDay(round.date)}</span>
                <span>
                  <span className="font-semibold text-rose-700">mortality {showCount(round.mortality)}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="font-semibold text-emerald-700">feed {showCount(round.feedKg, "kg")}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="font-semibold text-sky-700">water {showCount(round.waterLitres, "L")}</span>
                  {round.draft ? <span className="font-semibold text-amber-600"> · draft</span> : null}
                </span>
              </p>
            ))
          )}
        </TabsContent>
        <TabsContent value="performance" className="pt-4 text-sm">
          <Fact label="Latest weight" value={metrics.latestWeight === null ? "Not recorded" : `${formatNumber(metrics.latestWeight)} g`} />
          <Fact label="Sample quality" value={metrics.quality} />
          <Fact label="Estimated FCR" value={metrics.fcr === null ? "Unknown" : formatNumber(metrics.fcr, 2)} />
        </TabsContent>
        <TabsContent value="feed" className="pt-4 text-sm">
          <Fact label="Stock" value={`${formatNumber(metrics.stockKg)} kg`} />
          <Fact label="Runway" value={metrics.runwayDays === null ? "Unknown" : `${formatNumber(metrics.runwayDays, 1)} days`} />
        </TabsContent>
        <TabsContent value="health" className="pt-4 text-sm">
          {farm.health.filter((item) => item.batchId === batch.id).map((item) => (
            <p key={item.id} className="py-1">{formatDay(item.date)} · {item.signs}</p>
          ))}
          {farm.vaccinations.filter((item) => item.batchId === batch.id).map((item) => (
            <p key={item.id} className="py-1">{item.name} · {item.givenOn ? `given ${formatDay(item.givenOn)}` : `due ${formatDay(item.dueOn)}`}</p>
          ))}
        </TabsContent>
        <TabsContent value="dispatch" className="pt-4 text-sm">
          {farm.dispatches.filter((item) => item.batchId === batch.id).length === 0 ? (
            <p className="text-muted-foreground">No dispatch recorded. A dispatch is not a sale.</p>
          ) : (
            farm.dispatches.filter((item) => item.batchId === batch.id).map((item) => (
              <p key={item.id}>{formatDay(item.date)} · loaded {item.loaded}</p>
            ))
          )}
        </TabsContent>
        {owner ? (
          <TabsContent value="finance" className="pt-4 text-sm">
            <Fact label="Recorded cost" value={formatInr(finance.recordedCost)} />
            <Fact label="Supplier due" value={formatInr(finance.supplierDue)} />
            <Fact label="Estimated net" value={formatInr(finance.estimatedNet)} />
            <p className="pt-2 text-xs text-muted-foreground">Partial. No sale is recorded for this view of the ledger.</p>
          </TabsContent>
        ) : null}
        <TabsContent value="timeline" className="pt-4 text-sm">
          <p>Placed {formatDay(batch.placedOn)} · {formatNumber(batch.placed)} birds.</p>
          {farm.transfers.filter((item) => item.batchId === batch.id).map((item) => (
            <p key={item.id}>{formatDay(item.date)} · transfer {item.direction} {item.count}. {item.note}</p>
          ))}
          {batch.closedOn ? <p>Closed {formatDay(batch.closedOn)}.</p> : null}
        </TabsContent>
        <TabsContent value="report" className="pt-4 text-sm">
          <p>Scope: {batch.code}. Generated for this screen from recorded facts.</p>
          <p className="text-muted-foreground">Coverage {metrics.completeness.label}. Missing days are named, not filled.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function PlacementPage() {
  const farm = useFarm()
  const batch = farm.batch
  const [received, setReceived] = useState(String(batch?.received ?? ""))
  const [placed, setPlaced] = useState(String(batch?.placed ?? ""))
  const [error, setError] = useState("")

  function save() {
    const schema = z.object({
      received: z.coerce.number().int().min(0),
      placed: z.coerce.number().int().min(0),
    })
    const parsed = schema.safeParse({ received, placed })
    if (!parsed.success || !batch) {
      setError("Enter whole numbers for received and placed birds.")
      return
    }
    farm.dispatch({
      type: "save-batch",
      batchId: batch.id,
      patch: { received: parsed.data.received, placed: parsed.data.placed },
    })
    toast.success("Placement updated. The previous placed count is replaced and the change is in this session.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Batches"
        title="Placement"
        description="Ordered, received, and placed stay separate. A shortage is a reconciliation, not a silent edit."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{batch?.code}</CardTitle>
            <CardDescription>
              {batch?.supplier} · lot {batch?.supplierLot} · {formatDay(batch?.placedOn ?? todayISO())}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Fact label="Ordered" value={formatNumber(batch?.ordered ?? 0)} />
            <div className="grid gap-1.5">
              <Label htmlFor="received">Received</Label>
              <Input id="received" className="h-12" value={received} onChange={(event) => setReceived(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="placed">Placed</Label>
              <Input id="placed" className="h-12" value={placed} onChange={(event) => setPlaced(event.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              First 24-hour check: {batch?.firstDay === "completed" ? "Completed" : "Not recorded"}. Feed, water, and litter were confirmed on day 1.
            </p>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="h-11" onClick={save}>Save placement</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shed allocation</CardTitle>
            <CardDescription>Initial placement by shed. This is not a live recount.</CardDescription>
          </CardHeader>
          <CardContent>
            {farm.sheds.map((shed) => (
              <Fact key={shed.id} label={shed.name} value={`${formatNumber(shed.placedBirds)} placed`} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DispatchPage() {
  const farm = useFarm()
  const [loaded, setLoaded] = useState("")
  const [caught, setCaught] = useState("")
  const [destination, setDestination] = useState("Kovai Fresh Mart")
  const [farmGate, setFarmGate] = useState("")
  const [buyerWeight, setBuyerWeight] = useState("")
  const [error, setError] = useState("")

  function save() {
    const parsed = z.object({
      loaded: z.coerce.number().int().min(0),
      caught: z.coerce.number().int().min(0),
      destination: z.string().trim().min(2),
      farmGate: z.string(),
      buyerWeight: z.string(),
    }).safeParse({ loaded, caught, destination, farmGate, buyerWeight })
    if (!parsed.success || !farm.batch) {
      setError("Enter caught and loaded as whole numbers.")
      return
    }
    const gate = parsed.data.farmGate.trim() === "" ? null : Number(parsed.data.farmGate)
    const buyer = parsed.data.buyerWeight.trim() === "" ? null : Number(parsed.data.buyerWeight)
    if ((gate !== null && !Number.isFinite(gate)) || (buyer !== null && !Number.isFinite(buyer))) {
      setError("Weights must be numbers, or left blank.")
      return
    }
    const id = newId("dispatch")
    farm.dispatch({
      type: "add-dispatch",
      record: {
        id,
        batchId: farm.batch.id,
        date: todayISO(),
        caught: parsed.data.caught,
        loaded: parsed.data.loaded,
        rejected: Math.max(parsed.data.caught - parsed.data.loaded, 0),
        transporter: "Local catch team",
        vehicle: "",
        destination: parsed.data.destination,
        farmGateKg: gate,
        note: "",
        sync: "saved-locally",
      },
      settlement: buyer === null ? undefined : {
        id: newId("settle"),
        dispatchId: id,
        date: todayISO(),
        buyerWeightKg: buyer,
        classification: gate === null ? "unclassified" : "review",
        transportDeductionPaise: 0,
        otherDeductionPaise: 0,
        reference: "",
        status: "review",
      },
    })
    setLoaded("")
    setCaught("")
    setError("")
    toast.success("Dispatch saved. It reduces live birds and does not create a sale.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Batches"
        title="Dispatch and settlement"
        description="Loaded birds leave the live count. A buyer weight is a reconciliation, not proof of loss."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>New dispatch</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Caught" value={caught} onChange={setCaught} />
            <Field label="Loaded" value={loaded} onChange={setLoaded} />
            <Field label="Farm-gate kg" value={farmGate} onChange={setFarmGate} />
            <Field label="Buyer settlement kg" value={buyerWeight} onChange={setBuyerWeight} />
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="dest">Destination</Label>
              <Input id="dest" className="h-11" value={destination} onChange={(event) => setDestination(event.target.value)} />
            </div>
            {error ? <p className="text-xs text-destructive sm:col-span-2">{error}</p> : null}
            <Button className="h-11 sm:col-span-2 sm:w-fit" onClick={save}>Save dispatch</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recorded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {farm.dispatches.length === 0 ? <p className="text-muted-foreground">None yet.</p> : null}
            {farm.dispatches.map((item) => {
              const settlement = farm.settlements.find((entry) => entry.dispatchId === item.id)
              const delta =
                item.farmGateKg !== null && settlement?.buyerWeightKg !== null && settlement
                  ? settlement.buyerWeightKg - item.farmGateKg
                  : null
              return (
                <div key={item.id}>
                  <p className="font-medium">{formatDay(item.date)} · {item.loaded} loaded</p>
                  <p className="text-muted-foreground">
                    {item.destination}
                    {delta === null ? "" : ` · weight difference ${formatNumber(delta, 1)} kg`}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function CloseoutPage() {
  const farm = useFarm()
  const [lessons, setLessons] = useState(farm.batch?.lessons ?? "")
  const gaps = [
    farm.todayRound && !farm.todayRound.draft ? null : "Today’s farm round is not saved.",
    farm.completeness.label === "Complete" ? null : `Record coverage is ${farm.completeness.label}.`,
    farm.dispatches.length === 0 ? "No dispatch is recorded." : null,
    farm.sales.length === 0 ? "No sale is recorded." : null,
  ].filter(Boolean)

  function save(close: boolean) {
    if (!farm.batch) return
    const parsed = z.string().trim().min(close ? 8 : 0).safeParse(lessons)
    if (!parsed.success) {
      toast.error("Write a short lesson before closing the batch.")
      return
    }
    farm.dispatch({
      type: "save-batch",
      batchId: farm.batch.id,
      patch: {
        lessons: parsed.data,
        status: close ? "closed" : farm.batch.status,
        closedOn: close ? todayISO() : farm.batch.closedOn,
      },
    })
    toast.success(close ? "Batch marked closed in this demo." : "Lessons saved.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Batches"
        title="Closeout"
        description="Review gaps before the batch is closed. Closing does not invent the missing records."
      />
      <Card>
        <CardHeader>
          <CardTitle>Gaps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {gaps.map((gap) => (
            <p key={gap}>{gap}</p>
          ))}
          <Label htmlFor="lessons">Lessons for the next batch</Label>
          <Textarea id="lessons" value={lessons} onChange={(event) => setLessons(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-11" onClick={() => save(false)}>Save lessons</Button>
            <Button className="h-11" onClick={() => save(true)}>Close batch</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ComparePage() {
  const farm = useFarm()
  const active = farm.batches.find((batch) => batch.status === "active") ?? farm.batch
  const closed = farm.batches.find((batch) => batch.status === "closed")
  const activeMetrics = active ? buildMetrics(farm.state, active.id) : null
  const owner = canSeeFinance(farm.role)

  return (
    <div>
      <PageHeader
        eyebrow="Batches"
        title="Comparison"
        description="The closed batch uses its saved summary. The active batch uses current records."
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{active?.code}</CardTitle>
            <CardDescription>Active · day {activeMetrics?.day}</CardDescription>
          </CardHeader>
          <CardContent>
            <Fact label="Live birds" value={formatNumber(activeMetrics?.live ?? 0)} />
            <Fact label="Mortality" value={formatNumber(activeMetrics?.mortalityTotal ?? 0)} />
            <Fact label="Estimated FCR" value={activeMetrics?.fcr === null || activeMetrics?.fcr === undefined ? "Unknown" : formatNumber(activeMetrics.fcr, 2)} />
            <Fact label="Coverage" value={activeMetrics?.completeness.label ?? "Missing"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{closed?.code ?? "No closed batch"}</CardTitle>
            <CardDescription>Closed summary</CardDescription>
          </CardHeader>
          <CardContent>
            <Fact label="Placed" value={formatNumber(closed?.placed ?? 0)} />
            <Fact label="Mortality" value={formatNumber(closed?.summary?.mortality ?? 0)} />
            <Fact label="FCR" value={closed?.summary ? formatNumber(closed.summary.fcr, 2) : "Not recorded"} />
            <Fact label="Final weight" value={closed?.summary ? `${formatNumber(closed.summary.finalWeightGrams)} g` : "Not recorded"} />
            {owner ? (
              <Fact label="Recorded cost" value={closed?.summary ? formatInr(closed.summary.recordedCostPaise) : "—"} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input className="h-12" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
