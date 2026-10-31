import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Textarea } from "@/components/ui/textarea"
import { Bird, Droplets, Wheat } from "lucide-react"
import { ColorStat } from "@/components/farm/color"
import { PageHeader, SyncBadge } from "@/components/farm/chrome"
import { formatNumber, showCount, todayISO } from "@/domain/format"
import { newId, useFarm } from "@/store/farm-store"

const schema = z
  .object({
    date: z.string().min(1, "Choose a date"),
    shedId: z.string().min(1, "Choose a shed"),
    mortalityMissing: z.boolean(),
    mortality: z.string(),
    cullsMissing: z.boolean(),
    culls: z.string(),
    feedMissing: z.boolean(),
    feedKg: z.string(),
    waterMissing: z.boolean(),
    waterLitres: z.string(),
    observation: z.string(),
    shedCondition: z.string(),
    healthNote: z.string(),
  })
  .superRefine((value, ctx) => {
    checkNumber(value.mortalityMissing, value.mortality, "mortality", true, ctx)
    checkNumber(value.cullsMissing, value.culls, "culls", true, ctx)
    checkNumber(value.feedMissing, value.feedKg, "feedKg", false, ctx)
    checkNumber(value.waterMissing, value.waterLitres, "waterLitres", false, ctx)
  })

type RoundForm = z.infer<typeof schema>
type RoundCtx = z.RefinementCtx

function checkNumber(
  missing: boolean,
  raw: string,
  path: keyof RoundForm,
  integer: boolean,
  ctx: RoundCtx,
) {
  if (missing) return
  if (raw.trim() === "") {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: "Enter a number or mark Not recorded.",
    })
    return
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0 || (integer && !Number.isInteger(parsed))) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: integer ? "Use a whole number, zero or greater." : "Use zero or a greater number.",
    })
  }
}

function readNumber(missing: boolean, raw: string) {
  if (missing) return null
  return Number(raw)
}

/**
 * The daily-round data entry: stat strip + form + guidance.
 * Shared by the full page (/record) and the quick popup dialog.
 * - variant="page" uses the roomy two-column layout with the guidance card.
 * - variant="dialog" stacks the form for a scrollable modal and hides the
 *   standalone guidance card (the notes move inline under the actions).
 * - onSaved fires after a successful save or draft so a dialog can close.
 */
export function DailyRoundForm({
  variant = "page",
  onSaved,
}: {
  variant?: "page" | "dialog"
  onSaved?: () => void
}) {
  const farm = useFarm()
  const isDialog = variant === "dialog"
  const existing = farm.rounds.find(
    (round) => round.batchId === farm.batch?.id && round.date === todayISO(),
  )
  const defaults = useMemo<RoundForm>(
    () => ({
      date: existing?.date ?? todayISO(),
      shedId: existing?.shedId ?? farm.sheds[0]?.id ?? "",
      mortalityMissing: existing ? existing.mortality === null : false,
      mortality: existing?.mortality === null || existing?.mortality === undefined ? "" : String(existing.mortality),
      cullsMissing: existing ? existing.culls === null : false,
      culls: existing?.culls === null || existing?.culls === undefined ? "" : String(existing.culls),
      feedMissing: existing ? existing.feedKg === null : false,
      feedKg: existing?.feedKg === null || existing?.feedKg === undefined ? "" : String(existing.feedKg),
      waterMissing: existing ? existing.waterLitres === null : false,
      waterLitres:
        existing?.waterLitres === null || existing?.waterLitres === undefined
          ? ""
          : String(existing.waterLitres),
      observation: existing?.observation ?? "Active",
      shedCondition: existing?.shedCondition ?? "Dry",
      healthNote: existing?.healthNote ?? "",
    }),
    [existing, farm.sheds],
  )

  const form = useForm<RoundForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const [savedSync, setSavedSync] = useState(existing?.sync ?? null)

  function save(values: RoundForm, draft: boolean) {
    if (!farm.batch) return
    if (draft) {
      const draftOk = values.date && values.shedId
      if (!draftOk) {
        toast.error("A draft still needs a date and a shed.")
        return
      }
    }
    const round = {
      id: existing?.id ?? newId("round"),
      batchId: farm.batch.id,
      date: values.date,
      shedId: values.shedId,
      mortality: draft ? loose(values.mortalityMissing, values.mortality) : readNumber(values.mortalityMissing, values.mortality),
      culls: draft ? loose(values.cullsMissing, values.culls) : readNumber(values.cullsMissing, values.culls),
      feedKg: draft ? loose(values.feedMissing, values.feedKg) : readNumber(values.feedMissing, values.feedKg),
      waterLitres: draft
        ? loose(values.waterMissing, values.waterLitres)
        : readNumber(values.waterMissing, values.waterLitres),
      observation: values.observation,
      shedCondition: values.shedCondition,
      healthNote: values.healthNote,
      draft,
      sync: "saved-locally" as const,
    }
    farm.dispatch({ type: "save-round", round })
    setSavedSync("saved-locally")
    toast.success(draft ? "Draft saved on this device." : "Round saved locally. Live birds and feed will update.")
    onSaved?.()
  }

  const guidance = (
    <div className="space-y-2 text-sm">
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">Drafts stay on the round and do not change live birds or stock.</p>
      <p className="rounded-xl bg-sky-50 px-3 py-2 text-sky-950">A saved number replaces the previous fact for this round and keeps the correction on the same record.</p>
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-950">Feed issued here is consumption. Spill and damage are recorded on Feed &amp; Inventory.</p>
    </div>
  )

  const fields = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="round-date">Date</Label>
          <Input id="round-date" type="date" className="h-12" {...form.register("date")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="round-shed">Shed</Label>
          <Select value={form.watch("shedId")} onValueChange={(value) => form.setValue("shedId", value)}>
            <SelectTrigger id="round-shed" className="h-12 w-full">
              <SelectValue placeholder="Shed" />
            </SelectTrigger>
            <SelectContent>
              {farm.sheds.map((shed) => (
                <SelectItem key={shed.id} value={shed.id}>
                  {shed.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CountField
          label="Mortality"
          unit="birds"
          missing={form.watch("mortalityMissing")}
          value={form.watch("mortality")}
          error={form.formState.errors.mortality?.message}
          onMissing={(missing) => form.setValue("mortalityMissing", missing)}
          onValue={(value) => form.setValue("mortality", value)}
        />
        <CountField
          label="Culls"
          unit="birds"
          missing={form.watch("cullsMissing")}
          value={form.watch("culls")}
          error={form.formState.errors.culls?.message}
          onMissing={(missing) => form.setValue("cullsMissing", missing)}
          onValue={(value) => form.setValue("culls", value)}
        />
        <CountField
          label="Feed used"
          unit="kg"
          missing={form.watch("feedMissing")}
          value={form.watch("feedKg")}
          error={form.formState.errors.feedKg?.message}
          onMissing={(missing) => form.setValue("feedMissing", missing)}
          onValue={(value) => form.setValue("feedKg", value)}
        />
        <CountField
          label="Water used"
          unit="L"
          missing={form.watch("waterMissing")}
          value={form.watch("waterLitres")}
          error={form.formState.errors.waterLitres?.message}
          onMissing={(missing) => form.setValue("waterMissing", missing)}
          onValue={(value) => form.setValue("waterLitres", value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Choice
          label="Flock observation"
          value={form.watch("observation")}
          options={["Active", "Quiet", "Huddling", "Uneven"]}
          onChange={(value) => form.setValue("observation", value)}
        />
        <Choice
          label="Shed condition"
          value={form.watch("shedCondition")}
          options={["Dry", "Damp", "Wet", "Caked"]}
          onChange={(value) => form.setValue("shedCondition", value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="health-note">Optional health note</Label>
        <Textarea id="health-note" className="min-h-20" {...form.register("healthNote")} />
      </div>
      {isDialog ? guidance : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" value="save" className="h-12 px-5">
          Save round
        </Button>
        <Button type="submit" value="draft" variant="outline" className="h-12 px-5">
          Save draft
        </Button>
      </div>
    </>
  )

  const formEl = (
    <form
      className={isDialog ? "grid gap-4" : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"}
      onSubmit={(event) => {
        event.preventDefault()
        const submitter = (event.nativeEvent as SubmitEvent).submitter
        const draft = submitter instanceof HTMLButtonElement && submitter.value === "draft"
        if (draft) {
          save(form.getValues(), true)
          return
        }
        void form.handleSubmit((values) => save(values, false))()
      }}
    >
      {isDialog ? (
        fields
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{farm.batch?.code}</CardTitle>
              <CardDescription>Large fields, one sitting. Aim for under a minute.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">{fields}</CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Before you save</CardTitle>
            </CardHeader>
            <CardContent>{guidance}</CardContent>
          </Card>
        </>
      )}
    </form>
  )

  return (
    <div className="grid gap-4">
      {isDialog && savedSync ? (
        <div className="flex justify-end">
          <SyncBadge status={savedSync} />
        </div>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ColorStat label="Mortality today" value={showCount(farm.todayMortality)} hint="Blank stays Not recorded." tone={farm.todayMortality !== null && farm.todayMortality > 15 ? "alert" : farm.todayMortality === 0 ? "good" : "default"} swatch="rose" icon={Bird} />
        <ColorStat label="Live birds" value={formatNumber(farm.live)} hint={`Day ${farm.day} · ${farm.batch?.code ?? "no batch"}`} tone="good" swatch="teal" icon={Bird} />
        <ColorStat label="Feed stock" value={`${formatNumber(farm.stockKg)} kg`} hint={farm.runwayDays === null ? "Runway unknown." : `${formatNumber(farm.runwayDays, 1)} days of runway.`} tone={farm.runwayDays !== null && farm.runwayDays < 7 ? "alert" : "good"} swatch="amber" icon={Wheat} />
        <ColorStat label="Latest water" value={farm.todayRound?.waterLitres == null ? "Not recorded" : `${formatNumber(farm.todayRound.waterLitres)} L`} hint="From today's round, if saved." swatch="blue" icon={Droplets} />
      </section>
      {formEl}
    </div>
  )
}

export function DailyRoundPage() {
  const farm = useFarm()
  const existing = farm.rounds.find(
    (round) => round.batchId === farm.batch?.id && round.date === todayISO(),
  )

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Daily Farm Round"
        description="Count what you saw. Zero means you counted none. Not recorded means you have not entered it yet."
        action={existing?.sync ? <SyncBadge status={existing.sync} /> : null}
      />
      <DailyRoundForm variant="page" />
    </div>
  )
}

function loose(missing: boolean, raw: string) {
  if (missing || raw.trim() === "") return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function CountField({
  label,
  unit,
  missing,
  value,
  error,
  onMissing,
  onValue,
}: {
  label: string
  unit?: string
  missing: boolean
  value: string
  error?: string
  onMissing: (missing: boolean) => void
  onValue: (value: string) => void
}) {
  return (
    <div className={`rounded-xl border border-l-4 p-3 ${label.startsWith("Mortality") ? "border-l-rose-400" : label.startsWith("Culls") ? "border-l-amber-400" : label.startsWith("Feed") ? "border-l-emerald-400" : "border-l-sky-400"}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <label className="flex items-center gap-2 text-xs font-medium">
          <Switch checked={missing} onCheckedChange={onMissing} />
          Not recorded
        </label>
      </div>
      <div className="relative">
        <Input
          inputMode="decimal"
          disabled={missing}
          aria-label={unit ? `${label} in ${unit}` : label}
          value={missing ? "" : value}
          placeholder={missing ? "Not recorded" : "0"}
          className={`h-12 text-lg ${unit && !missing ? "pr-12" : ""}`}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onValue(event.target.value)}
        />
        {unit && !missing ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground"
          >
            {unit}
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
