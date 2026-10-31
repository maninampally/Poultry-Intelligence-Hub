import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Bird, LogOut, Menu, UserRound } from "lucide-react"
import { navGroups, mobileTabs } from "@/components/layout/nav"
import { SyncBadge } from "@/components/farm/chrome"
import { DailyRoundDialog } from "@/components/farm/daily-round-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { syncLabels } from "@/domain/calc"
import { formatNumber } from "@/domain/format"
import type { Role } from "@/domain/types"
import { aggregateSync, useFarm } from "@/store/farm-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

const roleLabels: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  worker: "Worker",
}

function SideLink({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
}: {
  to: string
  label: string
  icon: typeof Menu
  end?: boolean
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] text-[#aebdb5] transition-colors",
          isActive
            ? "bg-gradient-to-r from-[rgba(73,160,127,0.25)] to-[rgba(73,160,127,0.08)] font-medium text-white shadow-[inset_3px_0_0_0_#83d2a7]"
            : "hover:bg-[#2b4238] hover:text-white",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </NavLink>
  )
}

export function AppShell() {
  const farm = useFarm()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const sync = aggregateSync(farm.state)
  const groups = navGroups.filter((group) => !group.ownerOnly || farm.role === "owner")

  function signOut() {
    farm.dispatch({ type: "sign-out" })
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-gradient-to-b from-[#14211c] to-[#1b2c25] text-sidebar-foreground shadow-[10px_0_30px_rgba(23,45,35,0.06)] lg:flex">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-[#e2f5cf] to-[#9ed9be] text-[#155d4e] shadow-[0_8px_20px_rgba(140,214,171,0.18)]">
            <Bird className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-none font-semibold tracking-tight text-white">Poultry Intelligence</p>
            <p className="mt-1 text-[9px] tracking-[0.18em] text-[#87a597] uppercase">Farm operations</p>
          </div>
        </div>

        <div className="mx-3 mt-2 mb-5 rounded-xl border border-[rgba(187,223,204,0.16)] bg-white/[0.055] px-3.5 py-3.5">
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#84958c] uppercase">Active farm</p>
          <p className="mt-1.5 mb-1 text-[13px] font-semibold text-white">{farm.settings.farmName}</p>
          <p className="flex items-center justify-between text-[11px] text-[#9aaba1]">
            <span>{farm.settings.location}</span>
          </p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2.5 pb-1 text-[11px] font-medium text-[#84958c]">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SideLink key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#2d4037] px-3 py-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-[#91a59a] transition-colors hover:bg-[#2b4238] hover:text-white"
            onClick={() => {
              farm.dispatch({ type: "sync-now" })
              toast.success("Marked synced in this demo. Nothing was sent to a server.")
            }}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", sync === "synced" ? "bg-[#64c38e]" : "bg-amber-400")} />
            {syncLabels[sync]}
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-background/88 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 lg:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-2">
              <HeaderFact label="Batch" value={farm.batch?.code ?? "No open batch"} />
              <HeaderFact label="Day" value={String(farm.day)} />
              <HeaderFact label="Live birds" value={formatNumber(farm.live)} />
              <button
                type="button"
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left shadow-[0_4px_14px_rgba(30,59,46,0.05)] transition-colors hover:border-[color-mix(in_oklch,var(--border),var(--primary)_30%)]"
                onClick={() => {
                  farm.dispatch({ type: "sync-now" })
                  toast.success("Marked synced in this demo. Nothing was sent to a server.")
                }}
              >
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Status</p>
                <p className="mt-0.5">
                  <SyncBadge status={sync} />
                </p>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={farm.role}
                onValueChange={(value) => farm.dispatch({ type: "set-role", role: value as Role })}
              >
                <SelectTrigger
                  className="h-9 w-[8.25rem] rounded-full border-border bg-card shadow-[0_4px_14px_rgba(30,59,46,0.05)]"
                  aria-label="View as"
                >
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleLabels) as Role[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="h-9 rounded-full bg-primary px-3.5 text-primary-foreground shadow-[0_7px_16px_rgba(8,127,115,0.18)] hover:bg-primary/90"
                onClick={() => setRoundOpen(true)}
              >
                Daily round
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e5f5ef] text-xs font-bold text-[#087f73] shadow-[0_4px_14px_rgba(30,59,46,0.05)]"
                    aria-label="Profile menu"
                  >
                    {farm.currentUser
                      ? farm.currentUser.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                      : <UserRound className="size-4" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{farm.currentUser?.name ?? "No profile"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserRound data-icon="inline-start" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} variant="destructive">
                    <LogOut data-icon="inline-start" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-36 lg:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card lg:hidden">
        <div className="grid grid-cols-5">
          {mobileTabs.map((tab) =>
            tab.to === "/record" ? (
              <button
                key={tab.to}
                type="button"
                onClick={() => setRoundOpen(true)}
                className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
              >
                <tab.icon className="size-5" />
                {tab.label}
              </button>
            ) : (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )
                }
              >
                <tab.icon className="size-5" />
                {tab.label}
              </NavLink>
            ),
          )}
          <button
            type="button"
            className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
            onClick={() => setMoreOpen(true)}
          >
            <Menu className="size-5" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[80svh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">More</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <NavLink
              to="/profile"
              onClick={() => setMoreOpen(false)}
              className="flex h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e5f5ef] text-xs font-bold text-[#087f73]">
                {farm.currentUser
                  ? farm.currentUser.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                  : <UserRound className="size-4" />}
              </span>
              {farm.currentUser?.name ?? "Profile"}
            </NavLink>
            {groups
              .filter((group) => group.id !== "today")
              .map((group) => (
                <div key={group.id}>
                  <p className="pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  <div className="grid gap-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMoreOpen(false)}
                        className="flex h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted"
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                farm.dispatch({ type: "sync-now" })
                toast.success("Marked synced in this demo. Nothing was sent to a server.")
                setMoreOpen(false)
              }}
            >
              Sync now
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full text-destructive"
              onClick={() => {
                setMoreOpen(false)
                signOut()
              }}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DailyRoundDialog open={roundOpen} onOpenChange={setRoundOpen} />
    </div>
  )
}
