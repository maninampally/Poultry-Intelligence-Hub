export function isoOffset(days: number, from = new Date()) {
  const date = new Date(from)
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return isoOffset(0)
}

export function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

export function formatLong(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatWhen(date = new Date()) {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function batchDay(placedOn: string, on = todayISO()) {
  const start = new Date(`${placedOn}T12:00:00`).getTime()
  const end = new Date(`${on}T12:00:00`).getTime()
  return Math.round((end - start) / 86_400_000) + 1
}

export function showCount(value: number | null, unit = "") {
  if (value === null) return "Not recorded"
  const text = formatNumber(value)
  return unit ? `${text} ${unit}` : text
}
