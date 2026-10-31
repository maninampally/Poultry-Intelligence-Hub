import { formatDay, formatNumber } from "@/domain/format"

export interface TrendSeries {
  key: string
  label: string
  from: string
  to: string
}

export function BarTrend({
  data,
  series,
  unit = "",
  height = 150,
}: {
  data: Array<{ date: string; [key: string]: number | string }>
  series: TrendSeries[]
  unit?: string
  height?: number
}) {
  const max = Math.max(1, ...data.flatMap((day) => series.map((item) => Number(day[item.key] ?? 0))))
  return (
    <div>
      {series.length > 1 ? (
        <div className="mb-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          {series.map((item) => (
            <span key={item.key} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: item.to }} />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-stretch justify-around gap-2" style={{ height }}>
        {data.map((day) => (
          <div key={day.date} className="flex h-full min-w-6 flex-1 flex-col items-center justify-end gap-1.5">
            <div className="flex h-[85%] items-end gap-1">
              {series.map((item) => {
                const value = Number(day[item.key] ?? 0)
                return (
                  <div
                    key={item.key}
                    className="w-2 rounded-t-[4px]"
                    style={{
                      height: `${Math.max(2, (value / max) * 100)}%`,
                      background: `linear-gradient(180deg, ${item.from}, ${item.to})`,
                    }}
                    title={`${formatDay(day.date)} · ${item.label} · ${formatNumber(value)}${unit}`}
                  />
                )
              })}
            </div>
            <p className="text-[9px] text-muted-foreground">{formatDay(day.date)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GrowthCurve({
  samples,
  standard,
  height = 190,
}: {
  samples: Array<{ day: number; grams: number }>
  standard: Array<{ day: number; grams: number }>
  height?: number
}) {
  const width = 600
  const padLeft = 38
  const padBottom = 20
  const padTop = 10
  const maxDay = Math.max(1, ...standard.map((item) => item.day), ...samples.map((item) => item.day))
  const maxGrams = Math.max(1, ...standard.map((item) => item.grams), ...samples.map((item) => item.grams)) * 1.08

  const x = (day: number) => padLeft + (day / maxDay) * (width - padLeft - 8)
  const y = (grams: number) => padTop + (1 - grams / maxGrams) * (height - padTop - padBottom)

  const standardPath = standard.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.day)} ${y(point.grams)}`).join(" ")
  const sortedSamples = samples.slice().sort((a, b) => a.day - b.day)
  const samplePath = sortedSamples.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.day)} ${y(point.grams)}`).join(" ")

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(maxGrams * fraction))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Weight vs breed guide curve">
      {yTicks.map((grams) => (
        <g key={grams}>
          <line
            x1={padLeft}
            x2={width - 4}
            y1={y(grams)}
            y2={y(grams)}
            stroke="#e8eeea"
            strokeDasharray={grams === 0 ? undefined : "3 4"}
          />
          <text x={0} y={y(grams) + 3} fontSize="9" fill="#9aa69f">
            {grams >= 1000 ? `${(grams / 1000).toFixed(1)}k` : grams}
          </text>
        </g>
      ))}

      <path d={standardPath} fill="none" stroke="#c7d2cb" strokeWidth="2" strokeDasharray="4 4" />

      {samplePath ? <path d={samplePath} fill="none" stroke="#087f73" strokeWidth="2.5" /> : null}
      {sortedSamples.map((point) => (
        <circle key={point.day} cx={x(point.day)} cy={y(point.grams)} r="4" fill="#087f73">
          <title>{`Day ${point.day} · ${formatNumber(point.grams)} g`}</title>
        </circle>
      ))}

      <text x={width - 4} y={y(standard[standard.length - 1]?.grams ?? 0) - 6} fontSize="9" fill="#9aa69f" textAnchor="end">
        Breed guide
      </text>
    </svg>
  )
}
