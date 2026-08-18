import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted-border",
  active: "bg-[hsl(142,38%,28%)]/10 text-[hsl(142,46%,26%)] border-[hsl(142,38%,28%)]/20",
  harvesting: "bg-[hsl(30,88%,56%)]/15 text-[hsl(25,78%,38%)] border-[hsl(30,88%,56%)]/30",
  closed: "bg-muted text-muted-foreground border-muted-border",
  info: "bg-[hsl(200,40%,38%)]/15 text-[hsl(200,40%,32%)] border-[hsl(200,40%,38%)]/25",
  warning: "bg-[hsl(38,90%,50%)]/15 text-[hsl(28,80%,32%)] border-[hsl(38,90%,50%)]/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  good: "bg-[hsl(142,42%,38%)]/15 text-[hsl(142,46%,26%)] border-[hsl(142,42%,38%)]/25",
  bad: "bg-destructive/10 text-destructive border-destructive/30",
  completed: "bg-[hsl(142,42%,38%)]/15 text-[hsl(142,46%,26%)] border-[hsl(142,42%,38%)]/25",
  due: "bg-[hsl(30,88%,56%)]/15 text-[hsl(25,78%,38%)] border-[hsl(30,88%,56%)]/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
  upcoming: "bg-muted text-muted-foreground border-muted-border",
  better: "bg-[hsl(142,42%,38%)]/15 text-[hsl(142,46%,26%)] border-[hsl(142,42%,38%)]/25",
  average: "bg-muted text-muted-foreground border-muted-border",
  worse: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const c = styles[status] ?? styles.info;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide",
        c,
        className,
      )}
    >
      {status}
    </span>
  );
}
