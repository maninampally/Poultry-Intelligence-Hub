export type QuantityKind = "mass" | "weight" | "volume" | "count"

export interface UnitContext {
  bagSizeKg?: number
}

// Fixed conversion factors to the canonical unit of each kind.
// canonical: mass -> kg, weight -> gram, volume -> litre, count -> unit.
const FIXED_FACTORS: Record<QuantityKind, Record<string, number>> = {
  mass: { kg: 1, tonne: 1000, quintal: 100 },
  weight: { gram: 1, kg: 1000, lb: 453.592 },
  volume: { litre: 1 },
  count: { unit: 1 },
}

// Variable-factor units need a per-record context value to convert.
const VARIABLE_UNITS: Record<QuantityKind, string[]> = {
  mass: ["bags"],
  weight: [],
  volume: [],
  count: [],
}

function isBags(unit: string, kind: QuantityKind): boolean {
  return VARIABLE_UNITS[kind]?.includes(unit) ?? false
}

function requireBagSize(ctx?: UnitContext): number {
  const bagSizeKg = ctx?.bagSizeKg
  if (typeof bagSizeKg !== "number" || !Number.isFinite(bagSizeKg) || bagSizeKg <= 0) {
    throw new Error("Bags conversion requires a positive bag size in kilograms.")
  }
  return bagSizeKg
}

export function isValidUnit(unit: string, kind: QuantityKind): boolean {
  if (isBags(unit, kind)) return true
  return Object.prototype.hasOwnProperty.call(FIXED_FACTORS[kind] ?? {}, unit)
}

export function toCanonical(
  value: number,
  unit: string,
  kind: QuantityKind,
  ctx?: UnitContext,
): number {
  if (isBags(unit, kind)) {
    const bagSizeKg = requireBagSize(ctx)
    return value * bagSizeKg
  }
  const factor = FIXED_FACTORS[kind]?.[unit]
  if (factor === undefined) {
    throw new Error(`Unknown unit "${unit}" for kind "${kind}".`)
  }
  return value * factor
}

export function fromCanonical(
  canonical: number,
  unit: string,
  kind: QuantityKind,
  ctx?: UnitContext,
): number {
  if (isBags(unit, kind)) {
    const bagSizeKg = requireBagSize(ctx)
    return canonical / bagSizeKg
  }
  const factor = FIXED_FACTORS[kind]?.[unit]
  if (factor === undefined) {
    throw new Error(`Unknown unit "${unit}" for kind "${kind}".`)
  }
  return canonical / factor
}
