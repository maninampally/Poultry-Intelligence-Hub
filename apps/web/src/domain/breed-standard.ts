// Approximate broiler growth reference, grams by day. Not a sourced breed spec —
// a smooth guide curve to compare recorded samples against.
const CURVE: [day: number, grams: number][] = [
  [0, 42],
  [7, 180],
  [14, 430],
  [21, 800],
  [28, 1300],
  [35, 1900],
  [42, 2500],
  [49, 3000],
  [56, 3400],
]

export function standardWeightGrams(day: number) {
  if (day <= CURVE[0][0]) return CURVE[0][1]
  const last = CURVE[CURVE.length - 1]
  if (day >= last[0]) return last[1]
  for (let i = 0; i < CURVE.length - 1; i += 1) {
    const [d0, g0] = CURVE[i]
    const [d1, g1] = CURVE[i + 1]
    if (day >= d0 && day <= d1) {
      const t = (day - d0) / (d1 - d0)
      return Math.round(g0 + t * (g1 - g0))
    }
  }
  return last[1]
}

export function standardCurveUpTo(maxDay: number) {
  const days = Array.from({ length: Math.max(1, maxDay) + 1 }, (_, day) => day)
  return days.map((day) => ({ day, grams: standardWeightGrams(day) }))
}
