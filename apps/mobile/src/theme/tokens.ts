/**
 * Design tokens for Poultry Intelligence.
 * These mirror tailwind.config.js and are used where raw color values are
 * needed (charts, SVG, icons, status bars).
 * Palette derived from the product mockups: deep agricultural green brand,
 * cream/white surfaces, amber for "needs attention", red for critical.
 */
export const colors = {
  brand: "#2e7d52",
  brandDark: "#256541",
  brandLight: "#4fa172",
  brandSoft: "#e7f4ec",

  amber: "#e08a2b",
  amberSoft: "#fdf3e6",
  amberText: "#b06a17",

  danger: "#d64545",
  dangerSoft: "#fbeaea",
  dangerText: "#b23333",

  ok: "#2e7d52",
  okSoft: "#e7f4ec",
  okText: "#256541",

  cream: "#faf8f3",
  surface: "#ffffff",
  border: "#e8e6e0",

  ink: "#1f2723",
  inkMuted: "#6b746e",
  inkFaint: "#9aa19c",
} as const;

export type StatusTone = "ok" | "warning" | "critical" | "neutral" | "info";

/** Maps a semantic status tone to background + text colors. */
export const toneStyles: Record<
  StatusTone,
  { bg: string; text: string; dot: string }
> = {
  ok: { bg: colors.okSoft, text: colors.okText, dot: colors.ok },
  warning: { bg: colors.amberSoft, text: colors.amberText, dot: colors.amber },
  critical: {
    bg: colors.dangerSoft,
    text: colors.dangerText,
    dot: colors.danger,
  },
  neutral: { bg: "#f1f0ec", text: colors.inkMuted, dot: colors.inkFaint },
  info: { bg: "#e9f0fb", text: "#2b5fa1", dot: "#3b7ad1" },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
