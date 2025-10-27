import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TasksPage from "@/pages/TasksPage";
import TaskDetailsPage from "@/pages/TaskDetailsPage";
import CreateReportPage from "@/pages/CreateReportPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailsPage from "@/pages/ClientDetailsPage";
import ApplianceDetailsPage from "@/pages/ApplianceDetailsPage";
import StoragePage from "@/pages/StoragePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/tasks/:id" component={TaskDetailsPage} />
      <Route path="/tasks/:id/report" component={CreateReportPage} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/clients/:id" component={ClientDetailsPage} />
      <Route path="/appliances/:id" component={ApplianceDetailsPage} />
      <Route path="/storage" component={StoragePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const checkAndGenerateRecurringTasks = async () => {
      try {
        await apiRequest("POST", "/api/tasks/recurring/generate");
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      } catch (error) {
        console.error("Failed to generate recurring tasks:", error);
      }
    };

    checkAndGenerateRecurringTasks();
    
    const interval = setInterval(checkAndGenerateRecurringTasks, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
