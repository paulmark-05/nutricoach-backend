import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import MealLog from "@/pages/meal-log";
import Recipes from "@/pages/recipes";
import CheatMeals from "@/pages/cheat-meals";
import Profile from "@/pages/profile";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-pastel-blue-dark" />
      </div>
    );
  }

  if (!user) {
    // Redirect logic handled by use-auth hook or auth-utils typically, 
    // but for immediate UI feedback we render Landing if not logged in
    return <Landing />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        const { user, isLoading } = useAuth();
        if (isLoading) return <div className="h-screen bg-white" />;
        return user ? <Dashboard /> : <Landing />;
      }} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/meals">
        <ProtectedRoute component={MealLog} />
      </Route>
      <Route path="/recipes">
        <ProtectedRoute component={Recipes} />
      </Route>
      <Route path="/cheat-meals">
        <ProtectedRoute component={CheatMeals} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
