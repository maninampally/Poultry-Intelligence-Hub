import type { LucideIcon } from "lucide-react"
import {
  Bell,
  Bird,
  Boxes,
  ClipboardCheck,
  Droplets,
  Factory,
  FileBarChart,
  HandCoins,
  HeartPulse,
  House,
  LayoutDashboard,
  ListChecks,
  Scale,
  Settings,
  Shield,
  ShoppingCart,
  Sprout,
  Truck,
  Users,
  Wrench,
  BookOpen,
  Download,
  CircleHelp,
  Wheat,
} from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export interface NavGroup {
  id: string
  label: string
  ownerOnly?: boolean
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    id: "today",
    label: "Today",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/record", label: "Daily Farm Round", icon: ClipboardCheck },
      { to: "/alerts", label: "Alerts", icon: Bell },
      { to: "/tasks", label: "My Tasks", icon: ListChecks },
    ],
  },
  {
    id: "farm",
    label: "Farm work",
    items: [
      { to: "/farm/mortality", label: "Mortality", icon: Bird },
      { to: "/farm/feed", label: "Feed & Inventory", icon: Wheat },
      { to: "/farm/water", label: "Water & Environment", icon: Droplets },
      { to: "/farm/weight", label: "Weight & Performance", icon: Scale },
      { to: "/farm/health", label: "Health & Vaccination", icon: HeartPulse },
      { to: "/farm/biosecurity", label: "Biosecurity", icon: Shield },
      { to: "/farm/maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
  {
    id: "batches",
    label: "Batches",
    items: [
      { to: "/batches", label: "Active Batches", icon: Boxes, end: true },
      { to: "/batches/placement", label: "Placement", icon: Sprout },
      { to: "/batches/dispatch", label: "Dispatch", icon: Truck },
      { to: "/batches/closeout", label: "Closeout", icon: ClipboardCheck },
      { to: "/batches/compare", label: "Comparison", icon: Scale },
    ],
  },
  {
    id: "business",
    label: "Business",
    ownerOnly: true,
    items: [
      { to: "/business", label: "Finance", icon: HandCoins, end: true },
      { to: "/business/sales", label: "Sales", icon: ShoppingCart },
      { to: "/business/suppliers", label: "Suppliers", icon: Factory },
      { to: "/business/buyers", label: "Buyers", icon: Users },
      { to: "/business/plans", label: "Purchase Plans", icon: ShoppingCart },
      { to: "/business/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    id: "more",
    label: "More",
    items: [
      { to: "/more/farms", label: "Farm & Sheds", icon: House },
      { to: "/more/team", label: "Team", icon: Users },
      { to: "/more/sops", label: "SOPs", icon: BookOpen },
      { to: "/more/export", label: "Data Export", icon: Download },
      { to: "/more/settings", label: "Settings", icon: Settings },
      { to: "/more/help", label: "Help", icon: CircleHelp },
    ],
  },
]

export const mobileTabs = [
  { to: "/dashboard", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/record", label: "Record", icon: ClipboardCheck },
  { to: "/batches", label: "Batches", icon: Boxes },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
]
