import type { FeedMovement, WeightSample } from "@/domain/types"

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function liveBirds(input: {
  placed: number
  transfersIn: number
  transfersOut: number
  mortality: number
  culls: number
  dispatched: number
}) {
  return (
    input.placed +
    input.transfersIn -
    input.mortality -
    input.culls -
    input.dispatched -
    input.transfersOut
  )
}

export function feedStockKg(movements: Pick<FeedMovement, "kg" | "direction">[]) {
  return movements.reduce((total, movement) => total + movement.kg * movement.direction, 0)
}

export function performanceFeedKg(movements: FeedMovement[], batchId: string) {
  const issued = sum(
    movements
      .filter((movement) => movement.batchId === batchId && movement.reason === "issued")
      .map((movement) => movement.kg),
  )
  const returned = sum(
    movements
      .filter((movement) => movement.batchId === batchId && movement.reason === "returned")
      .map((movement) => movement.kg),
  )
  return issued - returned
}

export function recentDailyFeedKg(movements: FeedMovement[], batchId: string, days: string[]) {
  const byDay = new Map<string, number>()
  for (const movement of movements) {
    if (movement.batchId !== batchId || movement.reason !== "issued") continue
    if (!days.includes(movement.date)) continue
    byDay.set(movement.date, (byDay.get(movement.date) ?? 0) + movement.kg)
  }
  if (byDay.size < 3) return null
  return sum([...byDay.values()]) / byDay.size
}

export function feedRunwayDays(stockKg: number, recentDailyKg: number | null) {
  if (recentDailyKg === null || recentDailyKg <= 0) return null
  return stockKg / recentDailyKg
}

export function averageGrams(sample: Pick<WeightSample, "totalGrams" | "sampleSize"> | undefined) {
  if (!sample || sample.sampleSize <= 0) return null
  return sample.totalGrams / sample.sampleSize
}

export function estimatedFcr(feedKg: number, live: number, averageWeightGrams: number | null) {
  if (live <= 0 || averageWeightGrams === null || averageWeightGrams <= 0 || feedKg <= 0) {
    return null
  }
  const biomassKg = (live * averageWeightGrams) / 1000
  return feedKg / biomassKg
}

export function sampleQuality(sample: Pick<WeightSample, "sampleSize" | "zones"> | undefined) {
  if (!sample || sample.sampleSize <= 0) return "Unknown" as const
  const zones = sample.zones.split(",").map((zone) => zone.trim()).filter(Boolean)
  if (sample.sampleSize >= 40 && zones.length >= 3) return "Good" as const
  if (sample.sampleSize >= 20) return "Limited" as const
  return "Unknown" as const
}

export const syncLabels = {
  "saved-locally": "Saved locally",
  pending: "Pending sync",
  syncing: "Syncing",
  synced: "Synced",
  issue: "Sync issue",
  "needs-review": "Needs review",
} as const

export function canSeeFinance(role: "owner" | "manager" | "worker") {
  return role === "owner"
}
