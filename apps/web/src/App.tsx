import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { FarmProvider, useFarm } from "@/store/farm-store"
import { LoginPage } from "@/pages/auth"
import { OnboardingPage } from "@/pages/onboarding"
import { ProfilePage } from "@/pages/profile"
import { TodayPage } from "@/pages/today"
import { DailyRoundPage } from "@/pages/daily-round"
import { AlertsPage } from "@/pages/alerts"
import { TasksPage } from "@/pages/tasks"
import {
  BiosecurityPage,
  FeedPage,
  HealthPage,
  MaintenancePage,
  MortalityPage,
  WaterPage,
  WeightPage,
} from "@/pages/farm-work"
import {
  BatchDetailPage,
  BatchesPage,
  CloseoutPage,
  ComparePage,
  DispatchPage,
  PlacementPage,
} from "@/pages/batches"
import {
  BuyersPage,
  FinancePage,
  PlansPage,
  ReportsPage,
  SalesPage,
  SuppliersPage,
} from "@/pages/business"
import {
  ExportPage,
  FarmsPage,
  HelpPage,
  SettingsPage,
  SopsPage,
  TeamPage,
} from "@/pages/more"
import { PageHeader } from "@/components/farm/chrome"
import { LandingPage } from "@/pages/landing"

function RequireAuth({ children }: { children: ReactNode }) {
  const farm = useFarm()
  if (!farm.currentUserId) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <FarmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route
            path="onboarding"
            element={
              <RequireAuth>
                <OnboardingPage />
              </RequireAuth>
            }
          />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="profile" element={<ProfilePage />} />
            <Route path="dashboard" element={<TodayPage />} />
            <Route path="record" element={<DailyRoundPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="farm/mortality" element={<MortalityPage />} />
            <Route path="farm/feed" element={<FeedPage />} />
            <Route path="farm/water" element={<WaterPage />} />
            <Route path="farm/weight" element={<WeightPage />} />
            <Route path="farm/health" element={<HealthPage />} />
            <Route path="farm/biosecurity" element={<BiosecurityPage />} />
            <Route path="farm/maintenance" element={<MaintenancePage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="batches/placement" element={<PlacementPage />} />
            <Route path="batches/dispatch" element={<DispatchPage />} />
            <Route path="batches/closeout" element={<CloseoutPage />} />
            <Route path="batches/compare" element={<ComparePage />} />
            <Route path="batches/:batchId" element={<BatchDetailPage />} />
            <Route path="business" element={<FinancePage />} />
            <Route path="business/sales" element={<SalesPage />} />
            <Route path="business/suppliers" element={<SuppliersPage />} />
            <Route path="business/buyers" element={<BuyersPage />} />
            <Route path="business/plans" element={<PlansPage />} />
            <Route path="business/reports" element={<ReportsPage />} />
            <Route path="more/farms" element={<FarmsPage />} />
            <Route path="more/team" element={<TeamPage />} />
            <Route path="more/sops" element={<SopsPage />} />
            <Route path="more/export" element={<ExportPage />} />
            <Route path="more/settings" element={<SettingsPage />} />
            <Route path="more/help" element={<HelpPage />} />
            <Route path="*" element={<PageHeader title="Page not found" description="That screen is not part of this farm." />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </FarmProvider>
  )
}
