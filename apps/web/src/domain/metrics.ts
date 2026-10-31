import {
  averageGrams,
  estimatedFcr,
  feedRunwayDays,
  feedStockKg,
  liveBirds,
  performanceFeedKg,
  recentDailyFeedKg,
  sampleQuality,
  sum,
} from "@/domain/calc"
import { batchDay, isoOffset, todayISO } from "@/domain/format"
import type { FarmState } from "@/domain/types"

export function buildMetrics(state: FarmState, batchId = state.activeBatchId) {
  const batch = state.batches.find((item) => item.id === batchId) ?? state.batches[0]
  const today = todayISO()
  const recentDays = [-6, -5, -4, -3, -2, -1, 0].map((offset) => isoOffset(offset))

  const summarized =
    batch?.summary && !state.mortality.some((event) => event.batchId === batch.id)
  if (!batch || summarized) {
    const closed = batch
    const live = closed
      ? liveBirds({
          placed: closed.placed,
          transfersIn: 0,
          transfersOut: 0,
          mortality: closed.summary?.mortality ?? 0,
          culls: closed.summary?.culls ?? 0,
          dispatched: closed.summary?.dispatched ?? 0,
        })
      : 0
    return {
      batch: closed,
      day: closed ? batchDay(closed.placedOn) : 0,
      live,
      mortalityTotal: closed?.summary?.mortality ?? 0,
      cullTotal: closed?.summary?.culls ?? 0,
      dispatched: closed?.summary?.dispatched ?? 0,
      transfersIn: 0,
      transfersOut: 0,
      todayMortality: null as number | null,
      todayRound: undefined,
      stockKg: feedStockKg(state.feed),
      runwayDays: null as number | null,
      recentUseKg: null as number | null,
      performanceFeedKg: 0,
      feedDays: 0,
      latestWeight: null as number | null,
      previousWeight: null as number | null,
      latestSample: undefined,
      quality: "Unknown" as const,
      weightCoverage: "Limited" as const,
      fcr: closed?.summary?.fcr ?? null,
      completeness: { recorded: 0, expected: 0, label: "Missing" as const },
    }
  }

  const mortalityEvents = state.mortality.filter((event) => event.batchId === batch.id)
  const cullEvents = state.culls.filter((event) => event.batchId === batch.id)
  const transfers = state.transfers.filter((event) => event.batchId === batch.id)
  const dispatches = state.dispatches.filter((event) => event.batchId === batch.id)
  const mortality = sum(mortalityEvents.map((event) => event.count))
  const culls = sum(cullEvents.map((event) => event.count))
  const transfersIn = sum(
    transfers.filter((event) => event.direction === "in").map((event) => event.count),
  )
  const transfersOut = sum(
    transfers.filter((event) => event.direction === "out").map((event) => event.count),
  )
  const dispatched = sum(dispatches.map((event) => event.loaded))
  const todayEvents = mortalityEvents.filter((event) => event.date === today)
  const todayMortality = todayEvents.length === 0 ? null : sum(todayEvents.map((event) => event.count))
  const todayRound = state.rounds.find(
    (round) => round.batchId === batch.id && round.date === today,
  )

  const stockKg = feedStockKg(state.feed)
  const recentUseKg = recentDailyFeedKg(state.feed, batch.id, recentDays)
  const runwayDays = feedRunwayDays(stockKg, recentUseKg)
  const feedUsed = performanceFeedKg(state.feed, batch.id)
  const feedDays = new Set(
    state.feed
      .filter((movement) => movement.batchId === batch.id && movement.reason === "issued")
      .map((movement) => movement.date),
  ).size

  const samples = state.weights
    .filter((sample) => sample.batchId === batch.id)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const latest = samples.at(-1)
  const previous = samples.at(-2)
  const latestWeight = averageGrams(latest)
  const previousWeight = averageGrams(previous)
  const live = liveBirds({
    placed: batch.placed,
    transfersIn,
    transfersOut,
    mortality,
    culls,
    dispatched,
  })
  const day = batchDay(batch.placedOn)
  const expectedSamples = Math.max(1, Math.floor(day / 7))
  const weightCoverage =
    samples.length === 0 ? "Limited" : samples.length >= expectedSamples ? "High" : "Partial"

  let recorded = 0
  const expected = recentDays.length * 3
  for (const date of recentDays) {
    const round = state.rounds.find(
      (item) => item.batchId === batch.id && item.date === date && !item.draft,
    )
    if (!round) continue
    if (round.mortality !== null) recorded += 1
    if (round.feedKg !== null) recorded += 1
    if (round.waterLitres !== null) recorded += 1
  }
  const completeness = {
    recorded,
    expected,
    label: recorded === 0 ? "Missing" : recorded === expected ? "Complete" : "Partial",
  } as const

  return {
    batch,
    day,
    live,
    mortalityTotal: mortality,
    cullTotal: culls,
    dispatched,
    transfersIn,
    transfersOut,
    todayMortality,
    todayRound,
    stockKg,
    runwayDays,
    recentUseKg,
    performanceFeedKg: feedUsed,
    feedDays,
    latestWeight,
    previousWeight,
    latestSample: latest,
    quality: sampleQuality(latest),
    weightCoverage,
    fcr: estimatedFcr(feedUsed, live, latestWeight),
    completeness,
  }
}

export type FarmMetrics = ReturnType<typeof buildMetrics>
