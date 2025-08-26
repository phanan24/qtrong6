import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "./lib/protected-route";

import Header from "@/components/layout/header";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import QAPage from "@/pages/qa-page";
import HomeworkPage from "@/pages/homework-page";
import RankingsPage from "@/pages/rankings-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/qa" component={QAPage} />
          <ProtectedRoute path="/homework" component={HomeworkPage} />
          <ProtectedRoute path="/rankings" component={RankingsPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <AdminRoute path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
