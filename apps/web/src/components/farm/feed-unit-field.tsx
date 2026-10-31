import { Package, Scale } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FeedUnit = "kg" | "bags"

const CHOICES: { value: FeedUnit; label: string; icon: typeof Scale }[] = [
  { value: "kg", label: "Kilograms", icon: Scale },
  { value: "bags", label: "Bags", icon: Package },
]

export function FeedUnitField({
  idPrefix,
  feedUnit,
  bagSize,
  onFeedUnitChange,
  onBagSizeChange,
  bagSizeError,
}: {
  idPrefix: string
  feedUnit: FeedUnit
  bagSize: string
  onFeedUnitChange: (unit: FeedUnit) => void
  onBagSizeChange: (value: string) => void
  bagSizeError?: string
}) {
  const bagSizeId = `${idPrefix}-bag-size`
  return (
    <div className="grid gap-2">
      <Label id={`${idPrefix}-feed-unit-label`}>How do you measure feed?</Label>
      <div
        role="radiogroup"
        aria-labelledby={`${idPrefix}-feed-unit-label`}
        className="grid grid-cols-2 gap-3"
      >
        {CHOICES.map((choice) => {
          const active = feedUnit === choice.value
          const Icon = choice.icon
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onFeedUnitChange(choice.value)}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {choice.label}
            </button>
          )
        })}
      </div>
      {feedUnit === "bags" ? (
        <div className="grid gap-1.5">
          <Label htmlFor={bagSizeId}>Default bag size</Label>
          <div className="relative">
            <Input
              id={bagSizeId}
              className="h-12 pr-12"
              inputMode="decimal"
              value={bagSize}
              onChange={(event) => onBagSizeChange(event.target.value)}
              aria-invalid={bagSizeError ? true : undefined}
              aria-describedby={bagSizeError ? `${bagSizeId}-error` : undefined}
              aria-label="Default bag size in kilograms"
              placeholder="50"
            />
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
              aria-hidden="true"
            >
              kg
            </span>
          </div>
          {bagSizeError ? (
            <p id={`${bagSizeId}-error`} className="text-xs font-medium text-destructive" role="alert">
              {bagSizeError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
