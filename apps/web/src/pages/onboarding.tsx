import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import {
  Bird,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Home,
  PlusCircle,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FeedUnitField } from "@/components/farm/feed-unit-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  Batch,
  OnboardingDraft,
  OnboardingDraftBatch,
  OnboardingDraftShed,
  Shed,
} from "@/domain/types"
import { todayISO } from "@/domain/format"
import { cn } from "@/lib/utils"
import { newId, useFarm, type OnboardingCommit } from "@/store/farm-store"

const BREED_UNKNOWN = "Not known yet"

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Kolkata", label: "India — Asia/Kolkata" },
  { value: "Asia/Dhaka", label: "Bangladesh — Asia/Dhaka" },
  { value: "Asia/Karachi", label: "Pakistan — Asia/Karachi" },
  { value: "Asia/Colombo", label: "Sri Lanka — Asia/Colombo" },
  { value: "Asia/Dubai", label: "UAE — Asia/Dubai" },
  { value: "UTC", label: "UTC" },
]

function emptyShed(): OnboardingDraftShed {
  return { draftId: newId("sd"), name: "", capacity: "" }
}

function emptyBatch(): OnboardingDraftBatch {
  return {
    draftId: newId("bd"),
    code: "",
    breed: "",
    breedUnknown: false,
    supplier: "",
    date: "",
    placedCount: "",
    allocations: [],
  }
}

function freshDraft(): OnboardingDraft {
  return {
    draftId: newId("draft"),
    step: 1,
    farm: { farmName: "", location: "", timezone: "Asia/Kolkata", feedUnit: "kg", defaultBagKg: "" },
    sheds: [emptyShed()],
    batchMode: null,
    batch: null,
  }
}

// Backfill a persisted draft that predates newer fields (e.g. feed unit), so a
// resumed draft is always well-shaped and never has undefined string fields.
function normalizeDraft(draft: OnboardingDraft | null): OnboardingDraft {
  if (!draft) return freshDraft()
  const base = freshDraft()
  return {
    ...base,
    ...draft,
    farm: {
      ...base.farm,
      ...draft.farm,
      feedUnit: draft.farm?.feedUnit === "bags" ? "bags" : "kg",
      defaultBagKg: (draft.farm?.defaultBagKg ?? "").toString(),
    },
    sheds: Array.isArray(draft.sheds) && draft.sheds.length > 0 ? draft.sheds : base.sheds,
  }
}

function isPositiveInt(raw: string): boolean {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return false
  return Number.parseInt(trimmed, 10) > 0
}

function toInt(raw: string): number {
  return Number.parseInt(raw.trim(), 10)
}

export function OnboardingPage() {
  const farm = useFarm()
  const navigate = useNavigate()
  const dispatch = farm.dispatch

  const isOwner = farm.role === "owner"
  const completed = farm.onboarding.status === "completed"

  const [draft, setDraft] = useState<OnboardingDraft>(
    () => normalizeDraft(farm.onboarding.draft),
  )
  const [saved, setSaved] = useState(false)
  const [commitError, setCommitError] = useState("")
  const [showReview, setShowReview] = useState(false)
  const [attempted, setAttempted] = useState(false)

  // Begin collecting input for a not_started workspace.
  useEffect(() => {
    if (isOwner && !completed && farm.onboarding.status === "not_started") {
      dispatch({ type: "onboarding-start" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist the draft on every change so a refresh resumes.
  useEffect(() => {
    if (!isOwner || completed || saved) return
    dispatch({ type: "onboarding-save-draft", draft })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  if (!isOwner) return <Navigate to="/dashboard" replace />
  if (completed && !saved) return <Navigate to="/dashboard" replace />

  function update(next: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  const step = draft.step

  // ---- Validation -------------------------------------------------------
  const farmErrors = validateFarm(draft)
  const shedErrors = validateSheds(draft)
  const batchErrors = validateBatch(draft)

  function goToStep(target: 1 | 2 | 3) {
    setShowReview(false)
    setAttempted(false)
    setCommitError("")
    update({ step: target })
  }

  function handleContinue() {
    setAttempted(true)
    if (step === 1) {
      if (Object.keys(farmErrors).length > 0) return
      setAttempted(false)
      update({ step: 2 })
      return
    }
    if (step === 2) {
      if (Object.keys(shedErrors).length > 0 || draft.sheds.length === 0) return
      setAttempted(false)
      update({ step: 3 })
      return
    }
    // step 3 -> Review
    if (draft.batchMode === null) return
    if (Object.keys(batchErrors).length > 0) return
    setAttempted(false)
    setShowReview(true)
  }

  function handleBack() {
    if (showReview) {
      setShowReview(false)
      return
    }
    if (step === 1) return
    goToStep((step - 1) as 1 | 2 | 3)
  }

  function handleFinish() {
    setAttempted(true)
    setCommitError("")
    try {
      const commit = buildCommit(draft)
      dispatch({ type: "onboarding-complete", commit })
      setSaved(true)
    } catch {
      // Pre-commit validation failed: keep draft, stay in progress, allow retry.
      setCommitError("Some details still need fixing before setup can be saved. Review the highlighted fields.")
    }
  }

  if (saved) {
    return (
      <Shell>
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#e5f5ef] text-[#0e9a6e]">
            <CheckCircle2 className="size-7" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">You're all set</h2>
            <p className="text-sm text-muted-foreground">Your farm setup is saved on this device.</p>
          </div>
          <Button
            className="h-12 rounded-full bg-primary px-6 text-primary-foreground shadow-[0_7px_16px_rgba(8,127,115,0.18)] hover:bg-primary/90"
            onClick={() => navigate("/dashboard", { replace: true })}
          >
            Go to dashboard
          </Button>
        </div>
      </Shell>
    )
  }

  const totalCapacity = draft.sheds.reduce(
    (acc, shed) => acc + (isPositiveInt(shed.capacity) ? toInt(shed.capacity) : 0),
    0,
  )

  const primaryLabel = step < 3 ? "Continue" : showReview ? "Finish setup" : "Review"

  return (
    <Shell>
      <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-28 sm:px-6 lg:pb-12">
        <main className="w-full">
          {/* Header + horizontal step indicator (on top at all sizes) */}
          <header className="mb-6">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Poultry Intelligence
            </p>
            <h1 className="mt-1 text-lg font-bold tracking-tight">Set up your farm</h1>
            <StepIndicator step={step} showReview={showReview} />
          </header>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_7px_20px_rgba(33,61,46,0.045)] sm:p-7">
            {showReview ? (
              <ReviewStep
                draft={draft}
                onEdit={goToStep}
                commitError={commitError}
              />
            ) : step === 1 ? (
              <FarmStep
                draft={draft}
                errors={attempted ? farmErrors : {}}
                onChange={(farmPatch) => update({ farm: { ...draft.farm, ...farmPatch } })}
              />
            ) : step === 2 ? (
              <ShedsStep
                draft={draft}
                errors={attempted ? shedErrors : {}}
                totalCapacity={totalCapacity}
                onSheds={(sheds) => update({ sheds })}
              />
            ) : (
              <BatchStep
                draft={draft}
                errors={attempted ? batchErrors : {}}
                onDraft={update}
              />
            )}
          </div>

          {/* Desktop action row */}
          <div className="mt-6 hidden items-center justify-between lg:flex">
            {step === 1 && !showReview ? (
              <span />
            ) : (
              <Button variant="ghost" className="h-12 gap-1.5 px-3" onClick={handleBack}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
            <Button
              className="h-12 rounded-full bg-primary px-7 text-primary-foreground shadow-[0_7px_16px_rgba(8,127,115,0.18)] hover:bg-primary/90"
              onClick={showReview ? handleFinish : handleContinue}
            >
              {primaryLabel}
            </Button>
          </div>

          {/* Setup summary (below the form, all sizes) */}
          <div className="mt-6">
            <SummaryRail draft={draft} totalCapacity={totalCapacity} />
          </div>
        </main>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        {step === 1 && !showReview ? (
          <span className="flex-1" />
        ) : (
          <Button variant="ghost" className="h-12 gap-1.5 px-3" onClick={handleBack}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
        )}
        <Button
          className="h-12 flex-1 rounded-full bg-primary text-primary-foreground shadow-[0_7px_16px_rgba(8,127,115,0.18)] hover:bg-primary/90"
          onClick={showReview ? handleFinish : handleContinue}
        >
          {primaryLabel}
        </Button>
      </div>
    </Shell>
  )
}

// ======================================================================
// Shell / navigation chrome
// ======================================================================

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-[#f7f6f1]">{children}</div>
}

const STEP_META = [
  { n: 1 as const, word: "Farm", icon: Home },
  { n: 2 as const, word: "Sheds", icon: Building2 },
  { n: 3 as const, word: "Batch", icon: Bird },
]

function StepIndicator({ step, showReview }: { step: 1 | 2 | 3; showReview: boolean }) {
  return (
    <ol className="mt-4 flex items-center gap-2">
      {STEP_META.map((meta, index) => {
        const done = showReview || step > meta.n
        const current = !showReview && step === meta.n
        return (
          <li key={meta.n} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold",
                current ? "text-[#0e6f5f]" : done ? "text-[#4f9569]" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[11px]",
                  current
                    ? "border-[#0e6f5f] bg-[#e5f5ef] text-[#0e6f5f]"
                    : done
                      ? "border-[#4f9569] bg-[#e5f5ef] text-[#4f9569]"
                      : "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : meta.n}
              </span>
              {meta.word}
            </span>
            {index < STEP_META.length - 1 ? (
              <span className="h-px w-5 bg-border" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function SummaryRail({ draft, totalCapacity }: { draft: OnboardingDraft; totalCapacity: number }) {
  const filledSheds = draft.sheds.filter((shed) => shed.name.trim().length > 0)
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-[0_7px_20px_rgba(33,61,46,0.045)]">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Setup so far</p>
      <dl className="mt-3 space-y-2.5">
        <div>
          <dt className="text-xs text-muted-foreground">Farm</dt>
          <dd className="font-medium">{draft.farm.farmName.trim() || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Location</dt>
          <dd className="font-medium">{draft.farm.location.trim() || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sheds</dt>
          <dd className="font-medium">
            {filledSheds.length === 0
              ? "Not recorded"
              : `${filledSheds.length} ${filledSheds.length === 1 ? "shed" : "sheds"} · ${totalCapacity.toLocaleString()} total capacity`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">First batch</dt>
          <dd className="font-medium">{batchModeLabel(draft)}</dd>
        </div>
      </dl>
    </div>
  )
}

function batchModeLabel(draft: OnboardingDraft): string {
  if (draft.batchMode === "placed") return draft.batch?.code.trim() || "Already placed"
  if (draft.batchMode === "planned") return draft.batch?.code.trim() || "Planned"
  if (draft.batchMode === "later") return "Add later"
  return "Not chosen"
}

// ======================================================================
// Step 1 — Farm
// ======================================================================

function FarmStep({
  draft,
  errors,
  onChange,
}: {
  draft: OnboardingDraft
  errors: Record<string, string>
  onChange: (patch: Partial<OnboardingDraft["farm"]>) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Let's set up your farm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your farm details. You can add sheds and batches next.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ob-farm-name">Farm name</Label>
        <Input
          id="ob-farm-name"
          className="h-12"
          value={draft.farm.farmName}
          onChange={(event) => onChange({ farmName: event.target.value })}
          aria-invalid={errors.farmName ? true : undefined}
          placeholder="Annapurna Poultry Farm"
        />
        <FieldError id="ob-farm-name" message={errors.farmName} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ob-location">Location</Label>
        <Input
          id="ob-location"
          className="h-12"
          value={draft.farm.location}
          onChange={(event) => onChange({ location: event.target.value })}
          aria-invalid={errors.location ? true : undefined}
          placeholder="Salem, Tamil Nadu"
        />
        <FieldError id="ob-location" message={errors.location} />
      </div>
      <div className="grid gap-1.5">
        <Label>Farm timezone</Label>
        <Select value={draft.farm.timezone} onValueChange={(value) => onChange({ timezone: value })}>
          <SelectTrigger className="h-12 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FeedUnitField
        idPrefix="ob"
        feedUnit={draft.farm.feedUnit}
        bagSize={draft.farm.defaultBagKg}
        onFeedUnitChange={(unit) => onChange({ feedUnit: unit })}
        onBagSizeChange={(value) => onChange({ defaultBagKg: value })}
        bagSizeError={errors.defaultBagKg}
      />
      <p className="text-xs text-muted-foreground">You can change these later.</p>
    </div>
  )
}

// ======================================================================
// Step 2 — Sheds
// ======================================================================

function ShedsStep({
  draft,
  errors,
  totalCapacity,
  onSheds,
}: {
  draft: OnboardingDraft
  errors: Record<string, string>
  totalCapacity: number
  onSheds: (sheds: OnboardingDraftShed[]) => void
}) {
  function patchShed(draftId: string, patch: Partial<OnboardingDraftShed>) {
    onSheds(draft.sheds.map((shed) => (shed.draftId === draftId ? { ...shed, ...patch } : shed)))
  }
  function removeShed(draftId: string) {
    onSheds(draft.sheds.filter((shed) => shed.draftId !== draftId))
  }
  function addShed() {
    onSheds([...draft.sheds, emptyShed()])
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Where will your birds be housed?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add one shed or more. Capacity is not the number of birds currently placed.
        </p>
      </div>

      <div className="space-y-4">
        {draft.sheds.map((shed, index) => {
          const nameErr = errors[`shed-name-${shed.draftId}`]
          const capErr = errors[`shed-cap-${shed.draftId}`]
          return (
            <div key={shed.draftId} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Shed {index + 1}</p>
                {draft.sheds.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeShed(shed.draftId)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`shed-name-${shed.draftId}`}>Shed name</Label>
                  <Input
                    id={`shed-name-${shed.draftId}`}
                    className="h-12"
                    value={shed.name}
                    onChange={(event) => patchShed(shed.draftId, { name: event.target.value })}
                    aria-invalid={nameErr ? true : undefined}
                    placeholder="Shed A"
                  />
                  <FieldError id={`shed-name-${shed.draftId}`} message={nameErr} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`shed-cap-${shed.draftId}`}>Bird capacity</Label>
                  <div className="relative">
                    <Input
                      id={`shed-cap-${shed.draftId}`}
                      inputMode="numeric"
                      className="h-12 pr-12"
                      value={shed.capacity}
                      onChange={(event) => patchShed(shed.draftId, { capacity: event.target.value })}
                      aria-invalid={capErr ? true : undefined}
                      placeholder="5000"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground"
                    >
                      birds
                    </span>
                  </div>
                  <FieldError id={`shed-cap-${shed.draftId}`} message={capErr} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addShed}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0e6f5f] hover:text-[#0b574a]"
      >
        <PlusCircle className="size-4" />
        Add another shed
      </button>

      <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        {draft.sheds.length} {draft.sheds.length === 1 ? "shed" : "sheds"} ·{" "}
        {totalCapacity.toLocaleString()} total capacity
      </p>
      <p className="text-xs text-muted-foreground">
        Capacity is not the number of birds currently placed.
      </p>
    </div>
  )
}

// ======================================================================
// Step 3 — First batch
// ======================================================================

const BATCH_CHOICES: { mode: "planned" | "placed" | "later"; title: string; detail: string }[] = [
  { mode: "planned", title: "Plan a batch", detail: "Chicks have not arrived yet." },
  { mode: "placed", title: "Record an existing placement", detail: "Chicks are already placed." },
  { mode: "later", title: "I'll add a batch later", detail: "Set this up from your dashboard." },
]

function BatchStep({
  draft,
  errors,
  onDraft,
}: {
  draft: OnboardingDraft
  errors: Record<string, string>
  onDraft: (patch: Partial<OnboardingDraft>) => void
}) {
  function chooseMode(mode: "planned" | "placed" | "later") {
    if (mode === "later") {
      onDraft({ batchMode: "later", batch: null })
      return
    }
    const batch = draft.batch ?? emptyBatch()
    onDraft({ batchMode: mode, batch })
  }

  function patchBatch(patch: Partial<OnboardingDraftBatch>) {
    if (!draft.batch) return
    onDraft({ batch: { ...draft.batch, ...patch } })
  }

  const batch = draft.batch
  const mode = draft.batchMode
  const today = todayISO()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Ready to add your first batch?</h2>
        <p className="mt-1 text-sm text-muted-foreground">You can also do this later.</p>
      </div>

      <div className="grid gap-3">
        {BATCH_CHOICES.map((choice) => {
          const active = mode === choice.mode
          return (
            <button
              key={choice.mode}
              type="button"
              onClick={() => chooseMode(choice.mode)}
              aria-pressed={active}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                active ? "border-[#0e6f5f] bg-[#e5f5ef]" : "border-border hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-[#0e6f5f] bg-[#0e6f5f] text-white" : "border-muted-foreground/40",
                )}
              >
                {active ? <Check className="size-3" /> : null}
              </span>
              <span>
                <span className="block text-sm font-semibold">{choice.title}</span>
                <span className="block text-xs text-muted-foreground">{choice.detail}</span>
              </span>
            </button>
          )
        })}
      </div>

      {errors.mode ? <FieldError id="ob-batch-mode" message={errors.mode} /> : null}

      {batch && (mode === "planned" || mode === "placed") ? (
        <div className="space-y-5 border-t border-border pt-5">
          <div className="grid gap-1.5">
            <Label htmlFor="ob-batch-code">Batch name or code</Label>
            <Input
              id="ob-batch-code"
              className="h-12"
              value={batch.code}
              onChange={(event) => patchBatch({ code: event.target.value })}
              aria-invalid={errors.code ? true : undefined}
              placeholder="B-2026-01"
            />
            <FieldError id="ob-batch-code" message={errors.code} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ob-batch-breed">Breed or strain</Label>
            <Input
              id="ob-batch-breed"
              className="h-12"
              value={batch.breedUnknown ? "" : batch.breed}
              disabled={batch.breedUnknown}
              onChange={(event) => patchBatch({ breed: event.target.value })}
              placeholder="Cobb 430"
            />
            <label className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                checked={batch.breedUnknown}
                onChange={(event) =>
                  patchBatch({
                    breedUnknown: event.target.checked,
                    breed: event.target.checked ? BREED_UNKNOWN : "",
                  })
                }
              />
              Not known yet
            </label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ob-batch-supplier">Supplier (optional)</Label>
            <Input
              id="ob-batch-supplier"
              className="h-12"
              value={batch.supplier}
              onChange={(event) => patchBatch({ supplier: event.target.value })}
              placeholder="Venkateshwara Hatcheries"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ob-batch-date">
              {mode === "placed" ? "Actual placement date" : "Expected placement date"}
            </Label>
            <Input
              id="ob-batch-date"
              type="date"
              className="h-12"
              value={batch.date}
              max={mode === "placed" ? today : undefined}
              min={mode === "planned" ? today : undefined}
              onChange={(event) => patchBatch({ date: event.target.value })}
              aria-invalid={errors.date ? true : undefined}
            />
            <FieldError id="ob-batch-date" message={errors.date} />
          </div>

          {mode === "placed" ? (
            <PlacedAllocations
              draft={draft}
              batch={batch}
              errors={errors}
              patchBatch={patchBatch}
            />
          ) : (
            <PlannedAllocations draft={draft} batch={batch} patchBatch={patchBatch} />
          )}
        </div>
      ) : null}
    </div>
  )
}

function shedLabel(draft: OnboardingDraft, shedDraftId: string, index: number): string {
  const shed = draft.sheds.find((item) => item.draftId === shedDraftId)
  return shed?.name.trim() || `Shed ${index + 1}`
}

function PlacedAllocations({
  draft,
  batch,
  errors,
  patchBatch,
}: {
  draft: OnboardingDraft
  batch: OnboardingDraftBatch
  errors: Record<string, string>
  patchBatch: (patch: Partial<OnboardingDraftBatch>) => void
}) {
  const placed = isPositiveInt(batch.placedCount) ? toInt(batch.placedCount) : 0
  const allocated = batch.allocations.reduce(
    (acc, item) => acc + (isPositiveInt(item.count) ? toInt(item.count) : 0),
    0,
  )

  function toggleShed(shedDraftId: string, checked: boolean) {
    if (checked) {
      patchBatch({ allocations: [...batch.allocations, { shedDraftId, count: "" }] })
    } else {
      patchBatch({ allocations: batch.allocations.filter((a) => a.shedDraftId !== shedDraftId) })
    }
  }
  function setCount(shedDraftId: string, count: string) {
    patchBatch({
      allocations: batch.allocations.map((a) =>
        a.shedDraftId === shedDraftId ? { ...a, count } : a,
      ),
    })
  }

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="ob-batch-placed">Chicks placed</Label>
        <div className="relative">
          <Input
            id="ob-batch-placed"
            inputMode="numeric"
            className="h-12 pr-12"
            value={batch.placedCount}
            onChange={(event) => patchBatch({ placedCount: event.target.value })}
            aria-invalid={errors.placedCount ? true : undefined}
            placeholder="8000"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground"
          >
            birds
          </span>
        </div>
        <FieldError id="ob-batch-placed" message={errors.placedCount} />
      </div>

      <div className="space-y-2.5">
        <Label>Allocate to sheds</Label>
        {draft.sheds.map((shed, index) => {
          const alloc = batch.allocations.find((a) => a.shedDraftId === shed.draftId)
          const selected = alloc !== undefined
          const capacity = isPositiveInt(shed.capacity) ? toInt(shed.capacity) : 0
          const overCapacity =
            selected && alloc && isPositiveInt(alloc.count) && toInt(alloc.count) > capacity
          return (
            <div key={shed.draftId} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border"
                    checked={selected}
                    onChange={(event) => toggleShed(shed.draftId, event.target.checked)}
                  />
                  {shedLabel(draft, shed.draftId, index)}
                </label>
                <span className="text-xs text-muted-foreground">
                  Capacity {capacity.toLocaleString()}
                </span>
              </div>
              {selected && alloc ? (
                <div className="mt-2.5">
                  <Input
                    inputMode="numeric"
                    className="h-11"
                    value={alloc.count}
                    aria-label={`Birds in ${shedLabel(draft, shed.draftId, index)}`}
                    aria-invalid={errors[`alloc-${shed.draftId}`] || overCapacity ? true : undefined}
                    onChange={(event) => setCount(shed.draftId, event.target.value)}
                    placeholder="0"
                  />
                  {overCapacity ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                      <TriangleAlert className="size-3.5" />
                      Over capacity
                    </p>
                  ) : null}
                  <FieldError id={`alloc-${shed.draftId}`} message={errors[`alloc-${shed.draftId}`]} />
                </div>
              ) : null}
            </div>
          )
        })}

        <AllocationStatus placed={placed} allocated={allocated} />
        <FieldError id="ob-alloc-sum" message={errors.allocationSum} />
      </div>
    </>
  )
}

function AllocationStatus({ placed, allocated }: { placed: number; allocated: number }) {
  if (placed === 0) {
    return <p className="text-xs text-muted-foreground">Enter a placed count to allocate birds.</p>
  }
  if (allocated === placed) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-[#0e6f5f]">
        <Check className="size-3.5" />
        {allocated.toLocaleString()} of {placed.toLocaleString()} birds allocated
      </p>
    )
  }
  if (allocated < placed) {
    return (
      <p className="text-xs font-medium text-amber-600">
        {(placed - allocated).toLocaleString()} birds still need a shed allocation
      </p>
    )
  }
  return (
    <p className="text-xs font-medium text-amber-600">
      {(allocated - placed).toLocaleString()} birds more than the placed count are allocated
    </p>
  )
}

function PlannedAllocations({
  draft,
  batch,
  patchBatch,
}: {
  draft: OnboardingDraft
  batch: OnboardingDraftBatch
  patchBatch: (patch: Partial<OnboardingDraftBatch>) => void
}) {
  function toggleShed(shedDraftId: string, checked: boolean) {
    if (checked) {
      patchBatch({ allocations: [...batch.allocations, { shedDraftId, count: "" }] })
    } else {
      patchBatch({ allocations: batch.allocations.filter((a) => a.shedDraftId !== shedDraftId) })
    }
  }
  function setCount(shedDraftId: string, count: string) {
    patchBatch({
      allocations: batch.allocations.map((a) =>
        a.shedDraftId === shedDraftId ? { ...a, count } : a,
      ),
    })
  }

  return (
    <div className="space-y-2.5">
      <Label>Planned sheds (optional)</Label>
      <p className="text-xs text-muted-foreground">
        A plan holds no live birds. Record actual counts when the chicks arrive.
      </p>
      {draft.sheds.map((shed, index) => {
        const alloc = batch.allocations.find((a) => a.shedDraftId === shed.draftId)
        const selected = alloc !== undefined
        const capacity = isPositiveInt(shed.capacity) ? toInt(shed.capacity) : 0
        return (
          <div key={shed.draftId} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={selected}
                  onChange={(event) => toggleShed(shed.draftId, event.target.checked)}
                />
                {shedLabel(draft, shed.draftId, index)}
              </label>
              <span className="text-xs text-muted-foreground">Capacity {capacity.toLocaleString()}</span>
            </div>
            {selected && alloc ? (
              <div className="mt-2.5">
                <Input
                  inputMode="numeric"
                  className="h-11"
                  value={alloc.count}
                  aria-label={`Expected birds in ${shedLabel(draft, shed.draftId, index)}`}
                  onChange={(event) => setCount(shed.draftId, event.target.value)}
                  placeholder="Expected"
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

// ======================================================================
// Review
// ======================================================================

function ReviewStep({
  draft,
  onEdit,
  commitError,
}: {
  draft: OnboardingDraft
  onEdit: (step: 1 | 2 | 3) => void
  commitError: string
}) {
  const totalCapacity = draft.sheds.reduce(
    (acc, shed) => acc + (isPositiveInt(shed.capacity) ? toInt(shed.capacity) : 0),
    0,
  )
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Review your setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">Check the details before you finish.</p>
      </div>

      <ReviewRow title="Farm" onEdit={() => onEdit(1)}>
        <p className="font-medium">{draft.farm.farmName.trim() || "Not recorded"}</p>
        <p className="text-sm text-muted-foreground">{draft.farm.location.trim() || "Not recorded"}</p>
        <p className="text-sm text-muted-foreground">
          Feed unit:{" "}
          {draft.farm.feedUnit === "bags"
            ? `Bags (${draft.farm.defaultBagKg.trim() || "?"} kg)`
            : "Kilograms"}
        </p>
      </ReviewRow>

      <ReviewRow title="Sheds" onEdit={() => onEdit(2)}>
        {draft.sheds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not recorded</p>
        ) : (
          <ul className="space-y-0.5">
            {draft.sheds.map((shed) => (
              <li key={shed.draftId} className="text-sm">
                <span className="font-medium">{shed.name.trim() || "Unnamed shed"}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {(isPositiveInt(shed.capacity) ? toInt(shed.capacity) : 0).toLocaleString()} capacity
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {draft.sheds.length} {draft.sheds.length === 1 ? "shed" : "sheds"} ·{" "}
          {totalCapacity.toLocaleString()} total capacity
        </p>
      </ReviewRow>

      <ReviewRow title="First batch" onEdit={() => onEdit(3)}>
        {draft.batchMode === "later" || draft.batchMode === null || !draft.batch ? (
          <p className="text-sm text-muted-foreground">
            No batch added yet. You can create one from your dashboard.
          </p>
        ) : (
          <div className="space-y-0.5 text-sm">
            <p className="font-medium">{draft.batch.code.trim() || "Unnamed batch"}</p>
            <p className="text-muted-foreground">
              {draft.batchMode === "placed" ? "Already placed" : "Planned"}
              {" · "}
              {draft.batch.breedUnknown ? BREED_UNKNOWN : draft.batch.breed.trim() || "Breed not recorded"}
            </p>
            {draft.batchMode === "placed" ? (
              <p className="text-muted-foreground">
                {(isPositiveInt(draft.batch.placedCount) ? toInt(draft.batch.placedCount) : 0).toLocaleString()} birds placed
              </p>
            ) : null}
          </div>
        )}
      </ReviewRow>

      {commitError ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
          {commitError}
        </p>
      ) : null}
    </div>
  )
}

function ReviewRow({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-[#0e6f5f] hover:text-[#0b574a]"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}

// ======================================================================
// Shared bits
// ======================================================================

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={`${id}-error`} className="text-xs font-medium text-destructive" role="alert">
      {message}
    </p>
  )
}

// ======================================================================
// Validation (Zod-backed)
// ======================================================================

const farmSchema = z.object({
  farmName: z.string().trim().min(1, "Enter your farm name."),
  location: z.string().trim().min(1, "Enter your farm location."),
  timezone: z.string().min(1, "Choose a timezone."),
  feedUnit: z.enum(["kg", "bags"]),
})

function validateFarm(draft: OnboardingDraft): Record<string, string> {
  const result = farmSchema.safeParse(draft.farm)
  const errors: Record<string, string> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message
    }
  }
  if (draft.farm.feedUnit === "bags") {
    const raw = (draft.farm.defaultBagKg ?? "").toString().trim()
    const bagSize = Number(raw)
    if (raw === "" || !Number.isFinite(bagSize) || bagSize <= 0) {
      errors.defaultBagKg = "Enter a bag size in kg above zero."
    }
  }
  return errors
}

function validateSheds(draft: OnboardingDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (draft.sheds.length === 0) {
    errors.sheds = "Add at least one shed."
    return errors
  }
  const seen = new Map<string, string>()
  for (const shed of draft.sheds) {
    const name = shed.name.trim()
    if (name.length === 0) {
      errors[`shed-name-${shed.draftId}`] = "Enter a shed name."
    } else {
      const key = name.toLowerCase()
      if (seen.has(key)) {
        errors[`shed-name-${shed.draftId}`] = "Another shed already uses this name."
      } else {
        seen.set(key, shed.draftId)
      }
    }
    if (!isPositiveInt(shed.capacity)) {
      errors[`shed-cap-${shed.draftId}`] = "Enter a capacity as a whole number above zero."
    }
  }
  return errors
}

function validateBatch(draft: OnboardingDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (draft.batchMode === null) {
    errors.mode = "Choose one option to continue."
    return errors
  }
  if (draft.batchMode === "later" || !draft.batch) return errors

  const batch = draft.batch
  const today = todayISO()

  if (batch.code.trim().length === 0) {
    errors.code = "Enter a batch name or code."
  }

  if (draft.batchMode === "placed") {
    if (!isPositiveInt(batch.placedCount)) {
      errors.placedCount = "Enter the placed count as a whole number above zero."
    }
    if (batch.date.length === 0) {
      errors.date = "Choose the actual placement date."
    } else if (batch.date > today) {
      errors.date = "The placement date cannot be in the future."
    }
    let sum = 0
    for (const alloc of batch.allocations) {
      if (!isPositiveInt(alloc.count)) {
        errors[`alloc-${alloc.shedDraftId}`] = "Enter a whole number above zero."
        continue
      }
      const count = toInt(alloc.count)
      sum += count
      const shed = draft.sheds.find((item) => item.draftId === alloc.shedDraftId)
      const capacity = shed && isPositiveInt(shed.capacity) ? toInt(shed.capacity) : 0
      if (count > capacity) {
        errors[`alloc-${alloc.shedDraftId}`] = "This exceeds the shed capacity."
      }
    }
    if (batch.allocations.length === 0) {
      errors.allocationSum = "Allocate the placed birds to at least one shed."
    } else if (isPositiveInt(batch.placedCount) && sum !== toInt(batch.placedCount)) {
      errors.allocationSum = "The allocated birds must add up to the placed count."
    }
  } else {
    // planned
    if (batch.date.length === 0) {
      errors.date = "Choose the expected placement date."
    } else if (batch.date < today) {
      errors.date = "The expected date should be today or later."
    }
  }
  return errors
}

// ======================================================================
// Commit builder (re-validates, throws on failure)
// ======================================================================

function buildCommit(draft: OnboardingDraft): OnboardingCommit {
  const farmErrors = validateFarm(draft)
  const shedErrors = validateSheds(draft)
  const batchErrors = validateBatch(draft)
  if (
    Object.keys(farmErrors).length > 0 ||
    Object.keys(shedErrors).length > 0 ||
    Object.keys(batchErrors).length > 0 ||
    draft.batchMode === null
  ) {
    throw new Error("Draft failed validation")
  }

  const sheds: Shed[] = draft.sheds.map((shed) => ({
    id: `shed-${shed.draftId}`,
    name: shed.name.trim(),
    placedBirds: 0,
    capacity: toInt(shed.capacity),
  }))

  let commitBatch: OnboardingCommit["batch"] = null

  if (draft.batch && (draft.batchMode === "placed" || draft.batchMode === "planned")) {
    const source = draft.batch
    const breed = source.breedUnknown ? BREED_UNKNOWN : source.breed.trim()
    const allocations = source.allocations
      .filter((alloc) => isPositiveInt(alloc.count))
      .map((alloc) => ({
        shedId: `shed-${alloc.shedDraftId}`,
        count: toInt(alloc.count),
      }))
    const shedIds = allocations.map((alloc) => alloc.shedId)

    if (draft.batchMode === "placed") {
      const placed = toInt(source.placedCount)
      const batch: Batch = {
        id: `batch-${source.draftId}`,
        code: source.code.trim(),
        status: "active",
        breed,
        supplier: source.supplier.trim(),
        supplierLot: "",
        placedOn: source.date,
        ordered: placed,
        received: placed,
        placed,
        shedIds,
        allocations,
        lessons: "",
        closedOn: null,
        firstDay: "not-recorded",
        summary: null,
      }
      commitBatch = { kind: "placed", batch }
    } else {
      // planned — no live birds / placed counts
      const batch: Batch = {
        id: `batch-${source.draftId}`,
        code: source.code.trim(),
        status: "setup",
        breed,
        supplier: source.supplier.trim(),
        supplierLot: "",
        placedOn: source.date,
        ordered: 0,
        received: 0,
        placed: 0,
        shedIds,
        allocations: allocations.map((alloc) => ({ shedId: alloc.shedId, count: 0 })),
        lessons: "",
        closedOn: null,
        firstDay: "not-recorded",
        summary: null,
      }
      commitBatch = { kind: "planned", batch }
    }
  }

  return {
    draftId: draft.draftId,
    settings: {
      farmName: draft.farm.farmName.trim(),
      location: draft.farm.location.trim(),
      timezone: draft.farm.timezone,
      feedUnit: draft.farm.feedUnit,
      defaultBagKg:
        draft.farm.feedUnit === "bags" ? Number(draft.farm.defaultBagKg) : null,
    },
    sheds,
    batch: commitBatch,
  }
}
