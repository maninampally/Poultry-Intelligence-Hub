const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPreciseFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const numFormatter = new Intl.NumberFormat("en-IN");

export function formatINR(n: number, precise = false): string {
  if (!Number.isFinite(n)) return "—";
  return precise ? inrPreciseFormatter.format(n) : inrFormatter.format(n);
}

export function formatINRShort(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return inrFormatter.format(n);
}

export function formatNumber(n: number, digits?: number): string {
  if (!Number.isFinite(n)) return "—";
  if (typeof digits === "number") {
    return numFormatter.format(Number(n.toFixed(digits)));
  }
  return numFormatter.format(n);
}

export function formatPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function formatKg(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(2)} t`;
  return `${numFormatter.format(Number(n.toFixed(digits)))} kg`;
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateShort(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function formatTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function timeAgo(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDateShort(date);
}

export function todayISO(): string {
  return new Date().toISOString();
}
