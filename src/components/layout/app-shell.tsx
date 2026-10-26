import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import { navGroups, mobileTabs } from "@/components/layout/nav"
import { SyncBadge } from "@/components/farm/chrome"
import { Button } from "@/components/ui/button"
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
import { formatNumber } from "@/domain/format"
import type { Role } from "@/domain/types"
import { aggregateSync, useFarm } from "@/store/farm-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
          "flex h-11 items-center gap-2 rounded-lg px-3 text-sm",
          isActive
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
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
  const [moreOpen, setMoreOpen] = useState(false)
  const sync = aggregateSync(farm.state)
  const groups = navGroups.filter((group) => !group.ownerOnly || farm.role === "owner")

  return (
    <div className="min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 pt-6 pb-4">
          <p className="font-display text-2xl leading-none font-semibold">Poultry Intelligence</p>
          <p className="mt-2 text-xs text-sidebar-foreground/70">{farm.settings.farmName}</p>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-3 pb-1 text-[11px] font-medium tracking-[0.16em] text-sidebar-foreground/50 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SideLink key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 lg:px-8">
            <div className="shrink-0">
              <p className="font-display text-xl leading-none font-semibold whitespace-nowrap">
                Day {farm.day}
                <span className="text-muted-foreground"> · </span>
                <span className="tabular-nums">{formatNumber(farm.live)}</span>
                <span className="text-base"> live</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{farm.batch?.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden sm:inline-flex"
                onClick={() => {
                  farm.dispatch({ type: "sync-now" })
                  toast.success("Marked synced in this demo. Nothing was sent to a server.")
                }}
              >
                <SyncBadge status={sync} />
              </button>
              <span className="sm:hidden">
                <SyncBadge status={sync} />
              </span>
              <Select
                value={farm.role}
                onValueChange={(value) => farm.dispatch({ type: "set-role", role: value as Role })}
              >
                <SelectTrigger className="h-9 w-[8.5rem]" aria-label="View as">
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
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-36 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {mobileTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <tab.icon className="size-5" />
              {tab.label}
            </NavLink>
          ))}
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
            <SheetTitle className="font-display text-xl">More</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
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
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
