import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Authentication removed
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Kanban from "@/pages/Kanban";
import Resources from "@/pages/Resources";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Pricing from "@/pages/Pricing";
import Analytics from "@/pages/Analytics";
import Notifications from "@/pages/Notifications";
import ClientPortal from "@/pages/ClientPortal";
import Chat from "@/pages/Chat";
import NexusTechLanding from "@/pages/NexusTechLanding";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ElementType, roles?: string[] }) {
  const [, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem("nexus_admin_auth") === "true";

  React.useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Redirect to="/pricing" />
      </Route>
      
      <Route path="/">
        <NexusTechLanding />
      </Route>


      <Route path="/clients">
        <ProtectedRoute component={Clients} roles={["admin"]} />
      </Route>
      <Route path="/clients/:id">
        <ProtectedRoute component={ClientDetail} roles={["admin"]} />
      </Route>
      <Route path="/projects">
        <ProtectedRoute component={Projects} roles={["admin", "dev"]} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectDetail} roles={["admin", "dev"]} />
      </Route>
      <Route path="/kanban">
        <ProtectedRoute component={Kanban} roles={["admin", "dev"]} />
      </Route>
      <Route path="/resources">
        <ProtectedRoute component={Resources} roles={["admin", "dev"]} />
      </Route>
      <Route path="/invoices">
        <ProtectedRoute component={Invoices} roles={["admin", "client"]} />
      </Route>
      <Route path="/invoices/:id">
        <ProtectedRoute component={InvoiceDetail} roles={["admin", "client"]} />
      </Route>
      <Route path="/pricing">
        <ProtectedRoute component={Pricing} roles={["admin", "dev"]} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} roles={["admin"]} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={Notifications} />
      </Route>
      <Route path="/client-portal">
        <ProtectedRoute component={ClientPortal} roles={["client"]} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>

      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <h1 className="sr-only" style={{ display: "none" }}>Frontend</h1>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
        </ThemeProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
