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
import { PageHeader, SyncBadge } from "@/components/farm/chrome"
import { todayISO } from "@/domain/format"
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

export function DailyRoundPage() {
  const farm = useFarm()
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
  }

  return (
    <div>
      <PageHeader
        eyebrow="Farm work"
        title="Daily Farm Round"
        description="Count what you saw. Zero means you counted none. Not recorded means you have not entered it yet."
        action={savedSync ? <SyncBadge status={savedSync} /> : null}
      />
      <form
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
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
        <Card>
          <CardHeader>
            <CardTitle>{farm.batch?.code}</CardTitle>
            <CardDescription>Large fields, one sitting. Aim for under a minute.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="round-date">Date</Label>
                <Input id="round-date" type="date" className="h-12" {...form.register("date")} />
              </div>
              <div className="grid gap-1.5">
                <Label>Shed</Label>
                <Select value={form.watch("shedId")} onValueChange={(value) => form.setValue("shedId", value)}>
                  <SelectTrigger className="h-12 w-full">
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
            <CountField
              label="Mortality"
              missing={form.watch("mortalityMissing")}
              value={form.watch("mortality")}
              error={form.formState.errors.mortality?.message}
              onMissing={(missing) => form.setValue("mortalityMissing", missing)}
              onValue={(value) => form.setValue("mortality", value)}
            />
            <CountField
              label="Culls"
              missing={form.watch("cullsMissing")}
              value={form.watch("culls")}
              error={form.formState.errors.culls?.message}
              onMissing={(missing) => form.setValue("cullsMissing", missing)}
              onValue={(value) => form.setValue("culls", value)}
            />
            <CountField
              label="Feed used (kg)"
              missing={form.watch("feedMissing")}
              value={form.watch("feedKg")}
              error={form.formState.errors.feedKg?.message}
              onMissing={(missing) => form.setValue("feedMissing", missing)}
              onValue={(value) => form.setValue("feedKg", value)}
            />
            <CountField
              label="Water used (litres)"
              missing={form.watch("waterMissing")}
              value={form.watch("waterLitres")}
              error={form.formState.errors.waterLitres?.message}
              onMissing={(missing) => form.setValue("waterMissing", missing)}
              onValue={(value) => form.setValue("waterLitres", value)}
            />
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
            <div className="flex flex-wrap gap-2">
              <Button type="submit" value="save" className="h-12 px-5">
                Save round
              </Button>
              <Button type="submit" value="draft" variant="outline" className="h-12 px-5">
                Save draft
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Before you save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Drafts stay on the round and do not change live birds or stock.</p>
            <p>A saved number replaces the previous fact for this round and keeps the correction on the same record.</p>
            <p>Feed issued here is consumption. Spill and damage are recorded on Feed & Inventory.</p>
          </CardContent>
        </Card>
      </form>
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
  missing,
  value,
  error,
  onMissing,
  onValue,
}: {
  label: string
  missing: boolean
  value: string
  error?: string
  onMissing: (missing: boolean) => void
  onValue: (value: string) => void
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <label className="flex items-center gap-2 text-xs font-medium">
          <Switch checked={missing} onCheckedChange={onMissing} />
          Not recorded
        </label>
      </div>
      <Input
        inputMode="decimal"
        disabled={missing}
        aria-label={label}
        value={missing ? "" : value}
        placeholder={missing ? "Not recorded" : "0"}
        className="h-12 text-lg"
        aria-invalid={error ? true : undefined}
        onChange={(event) => onValue(event.target.value)}
      />
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
