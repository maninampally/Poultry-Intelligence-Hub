import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/lang";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Farms from "@/pages/Farms";
import FarmDetail from "@/pages/FarmDetail";
import Batches from "@/pages/Batches";
import BatchDetail from "@/pages/BatchDetail";
import BatchReport from "@/pages/BatchReport";
import Compare from "@/pages/Compare";
import WhatIfPlanner from "@/pages/WhatIfPlanner";
import Insights from "@/pages/Insights";
import Alerts from "@/pages/Alerts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/farms" component={Farms} />
      <Route path="/farms/:farmId" component={FarmDetail} />
      <Route path="/batches" component={Batches} />
      <Route path="/compare" component={Compare} />
      <Route path="/planner" component={WhatIfPlanner} />
      <Route path="/batches/:batchId/report" component={BatchReport} />
      <Route path="/batches/:batchId" component={BatchDetail} />
      <Route path="/insights/:batchId" component={Insights} />
      <Route path="/alerts" component={Alerts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}

export default App;
