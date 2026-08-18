import { Link, useLocation } from "wouter";
import { type ReactNode } from "react";
import {
  LayoutDashboard,
  Tractor,
  Boxes,
  Bell,
  Sparkles,
  GitCompareArrows,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark, RoosterMark } from "./Brand";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { useListAlerts, getListAlertsQueryKey } from "@murgi-mitra/api-client-react";

interface NavItem {
  to: string;
  label: string;
  hi: string;
  icon: typeof LayoutDashboard;
  match?: (p: string) => boolean;
  badge?: number;
}

function useNav(): NavItem[] {
  const { data: alerts } = useListAlerts({ query: { queryKey: getListAlertsQueryKey(), staleTime: 30000 } });
  const openAlerts = alerts?.filter((a) => !a.resolvedAt).length ?? 0;
  return [
    { to: "/", label: "Dashboard", hi: "डैशबोर्ड", icon: LayoutDashboard, match: (p) => p === "/" || p === "" },
    { to: "/farms", label: "Farms", hi: "खेत", icon: Tractor, match: (p) => p.startsWith("/farms") },
    { to: "/batches", label: "Batches", hi: "बैच", icon: Boxes, match: (p) => p.startsWith("/batches") },
    { to: "/compare", label: "Compare", hi: "तुलना", icon: GitCompareArrows, match: (p) => p.startsWith("/compare") },
    { to: "/planner", label: "What-if", hi: "क्या-अगर", icon: Calculator, match: (p) => p.startsWith("/planner") },
    { to: "/alerts", label: "Alerts", hi: "सूचनाएँ", icon: Bell, match: (p) => p.startsWith("/alerts") || p.startsWith("/insights"), badge: openAlerts },
  ];
}

export function AppShell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const items = useNav();
  const { lang, setLang, t } = useLang();

  return (
    <div className="min-h-screen w-full bg-background text-foreground bg-paper">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 lg:w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <div className="px-5 py-5 border-b border-sidebar-border">
            <Link href="/" asChild>
              <a className="block hover-elevate -mx-2 px-2 py-1.5 rounded-md" data-testid="link-home-brand">
                <Wordmark />
              </a>
            </Link>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {items.map((it) => {
              const active = it.match ? it.match(loc) : loc === it.to;
              const Icon = it.icon;
              return (
                <Link key={it.to} href={it.to} asChild>
                  <a
                    data-testid={`link-nav-${it.label.toLowerCase()}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover-elevate relative",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80",
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5", active && "text-sidebar-primary")} strokeWidth={2.2} />
                    <span className="flex-1">{t(it.label, it.hi)}</span>
                    {it.badge && it.badge > 0 ? (
                      <span className="text-[10px] font-bold tabular bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {it.badge}
                      </span>
                    ) : null}
                  </a>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-sidebar-border space-y-3">
            <div className="rounded-md bg-sidebar-accent/40 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground/90">
                <Sparkles className="h-3.5 w-3.5 text-sidebar-primary" />
                {t("Daily tip", "रोज़ का सुझाव")}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-sidebar-foreground/70">
                {t(
                  "Weigh leftover feed every evening — it reveals FCR drift two days early.",
                  "रोज़ शाम को बचा हुआ फ़ीड तौलें — FCR का बदलाव दो दिन पहले दिख जाएगा।",
                )}
              </p>
            </div>
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              data-testid="button-lang-toggle"
              className="w-full flex items-center justify-between gap-2 rounded-md bg-sidebar-accent text-sidebar-accent-foreground px-3 py-2 text-xs font-medium hover-elevate"
            >
              <span>{t("Language", "भाषा")}</span>
              <span className="font-deva tabular">
                {lang === "en" ? "EN · हिं" : "हिं · EN"}
              </span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top bar */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-30">
            <Link href="/" asChild>
              <a><Wordmark compact /></a>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              data-testid="button-mobile-lang"
              className="text-sidebar-foreground hover-elevate"
            >
              <span className="font-deva text-xs">
                {lang === "en" ? "EN · हिं" : "हिं · EN"}
              </span>
            </Button>
          </header>

          <main className="flex-1 pb-20 md:pb-8">
            {children}
          </main>

          {/* Mobile bottom tab bar */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-sidebar text-sidebar-foreground border-t border-sidebar-border z-40">
            <div className="grid grid-cols-4 px-1 py-1.5">
              {items.map((it) => {
                const active = it.match ? it.match(loc) : loc === it.to;
                const Icon = it.icon;
                return (
                  <Link key={it.to} href={it.to} asChild>
                    <a
                      data-testid={`link-mobile-${it.label.toLowerCase()}`}
                      className={cn(
                        "flex flex-col items-center gap-0.5 py-1.5 rounded-md hover-elevate relative",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                      <span className="text-[10px] font-medium">{it.label}</span>
                      {it.badge && it.badge > 0 ? (
                        <span className="absolute top-0.5 right-3 h-1.5 w-1.5 rounded-full bg-destructive" />
                      ) : null}
                    </a>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
      <RoosterMark className="hidden" />
    </div>
  );
}
