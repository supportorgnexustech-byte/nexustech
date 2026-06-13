import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
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
import Users from "@/pages/Users";
import Notifications from "@/pages/Notifications";
import ClientPortal from "@/pages/ClientPortal";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, roles = [] }: { component: React.ElementType, roles?: string[] }) {
  const { isAuthenticated, currentUser } = useAuth();
  
  if (!isAuthenticated || !currentUser) {
    return <Redirect to="/login" />;
  }

  if (roles.length > 0 && !roles.includes(currentUser.role)) {
    return <Redirect to={currentUser.role === 'client' ? "/client-portal" : "/dashboard"} />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {isAuthenticated ? (
          <Redirect to={currentUser?.role === 'client' ? "/client-portal" : "/dashboard"} />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} roles={["admin", "dev"]} />
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
        <ProtectedRoute component={Pricing} roles={["admin"]} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} roles={["admin"]} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={Users} roles={["admin"]} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={Notifications} />
      </Route>
      <Route path="/client-portal">
        <ProtectedRoute component={ClientPortal} roles={["client"]} />
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
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
