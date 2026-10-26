// Money helpers. Money is stored as integer paise (AGENTS.md rule #7).
// 100 paise = 1 rupee. Formatting uses Indian digit grouping
// (e.g. 1,23,456.78). These functions only format; they never do
// financial math that belongs in the backend analytics engine.

/** Format integer paise as a rupee string with Indian grouping. */
export function formatPaise(
  paise: number,
  opts: { withSymbol?: boolean } = {},
): string {
  const withSymbol = opts.withSymbol ?? true;
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const paisePart = abs % 100;

  const grouped = groupIndian(rupees);
  const decimals = paisePart.toString().padStart(2, '0');
  const sign = negative ? '-' : '';
  const symbol = withSymbol ? '\u20B9' : '';
  return `${sign}${symbol}${grouped}.${decimals}`;
}

/** Group an integer with Indian numbering (last 3 digits, then pairs). */
export function groupIndian(value: number): string {
  const s = Math.abs(Math.trunc(value)).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${withCommas},${last3}`;
}

/** Convert rupees (number) to integer paise for storage. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
