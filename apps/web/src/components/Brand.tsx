import { useLang } from "@/lib/lang";

export function RoosterMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="rmComb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(14, 78%, 56%)" />
          <stop offset="100%" stopColor="hsl(0, 70%, 46%)" />
        </linearGradient>
        <linearGradient id="rmBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(30, 88%, 60%)" />
          <stop offset="100%" stopColor="hsl(25, 78%, 50%)" />
        </linearGradient>
      </defs>
      {/* Comb */}
      <path
        d="M22 14 q3 -8 8 -2 q3 -8 8 -2 q3 -7 8 -1 v8 H22 z"
        fill="url(#rmComb)"
      />
      {/* Head + body */}
      <path
        d="M18 22 q-2 16 14 22 q14 6 22 -6 q4 -6 -2 -14 q-6 -8 -16 -8 q-12 0 -18 6z"
        fill="url(#rmBody)"
      />
      {/* Wing */}
      <path
        d="M30 30 q10 -2 18 4 q-4 12 -16 12 q-10 0 -10 -8 q0 -6 8 -8z"
        fill="hsl(14, 68%, 42%)"
        opacity="0.85"
      />
      {/* Beak */}
      <path d="M14 22 l-6 1 l5 4 z" fill="hsl(42, 88%, 48%)" />
      {/* Eye */}
      <circle cx="20" cy="22" r="1.4" fill="hsl(28, 25%, 12%)" />
      {/* Wattle */}
      <path d="M14 26 q-2 4 1 6 q3 -1 3 -4z" fill="hsl(0, 70%, 46%)" />
      {/* Tail feathers */}
      <path
        d="M50 24 q10 -8 12 4 q-4 -2 -8 0 q4 4 0 8 q-4 -4 -10 -4z"
        fill="hsl(142, 38%, 32%)"
      />
      {/* Legs */}
      <path d="M28 50 v6 M40 50 v6" stroke="hsl(28, 35%, 20%)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang();
  return (
    <div className="flex items-center gap-2.5">
      <RoosterMark className="h-9 w-9 shrink-0" />
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">
            Murgi Mitra
          </span>
          <span
            className="font-deva text-[11px] font-medium text-sidebar-foreground/70"
            lang="hi"
          >
            मुर्गी मित्र · {lang === "hi" ? "खेत साथी" : "your farm companion"}
          </span>
        </div>
      )}
    </div>
  );
}
