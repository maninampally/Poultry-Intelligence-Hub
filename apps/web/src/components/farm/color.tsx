import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// One fixed semantic family, reused everywhere a stat card needs an accent.
// teal = good/primary, amber = watch, blue = neutral/info, purple = secondary,
// orange = alert, rose = biological concern (mortality, health signs).
export const swatches = {
  teal: "bg-[#e5f5ef] text-[#087f73]",
  amber: "bg-[#fff3df] text-[#b8670b]",
  blue: "bg-[#eaf3fb] text-[#266aa6]",
  purple: "bg-[#f1ecfb] text-[#7150a5]",
  orange: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
} as const

const swatchBorder: Record<Swatch, string> = {
  teal: "#087f73",
  amber: "#d99735",
  blue: "#5790c2",
  purple: "#9a78c5",
  orange: "#d9733a",
  rose: "#e1587a",
}

export type Swatch = keyof typeof swatches
export type Tone = "default" | "good" | "warn" | "alert"

const valueTone: Record<Tone, string> = {
  default: "text-foreground",
  good: "text-emerald-600",
  warn: "text-amber-600",
  alert: "text-orange-600",
}

export function ColorStat({
  label,
  value,
  hint,
  tone = "default",
  swatch = "blue",
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  tone?: Tone
  swatch?: Swatch
  icon?: LucideIcon
}) {
  return (
    <div
      className="min-h-[8.25rem] rounded-[13px] border border-t-[3px] border-border bg-card px-4 py-3.5 shadow-[0_7px_20px_rgba(33,61,46,0.045)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(33,61,46,0.10)]"
      style={{ borderTopColor: swatchBorder[swatch] }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
        {Icon ? (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-[9px]", swatches[swatch])}>
            <Icon className="size-3.5" />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-4 leading-none font-bold tracking-tight tabular-nums",
          value.length > 8 ? "text-xl" : "text-[1.65rem]",
          valueTone[tone],
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function Meter({
  value,
  max = 100,
  tone = "default",
  label,
}: {
  value: number
  max?: number
  tone?: Tone
  label?: string
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  const barTone = {
    default: "bg-[#087f73]",
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    alert: "bg-orange-500",
  }[tone]
  return (
    <div>
      {label ? <p className="mb-1.5 text-xs text-muted-foreground">{label}</p> : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barTone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function DetailBox({
  label,
  children,
  swatch = "blue",
}: {
  label: string
  children: ReactNode
  swatch?: Swatch
}) {
  return (
    <div className={cn("rounded-xl px-3 py-2", swatches[swatch])}>
      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase opacity-80">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}
