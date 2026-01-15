import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Utensils,
  ChefHat,
  Cookie,
  UserCircle,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-pastel-blue-dark" },
    { label: "Meal Log", href: "/meals", icon: Utensils, color: "text-pastel-green-dark" },
    { label: "Recipes", href: "/recipes", icon: ChefHat, color: "text-pastel-purple-dark" },
    { label: "Cheat Meals", href: "/cheat-meals", icon: Cookie, color: "text-pastel-pink-dark" },
    { label: "Profile", href: "/profile", icon: UserCircle, color: "text-pastel-yellow-dark" },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-slate-100">
      <div className="p-6 border-b border-slate-50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pastel-pink-dark to-pastel-purple-dark bg-clip-text text-transparent">
          NutriCoach
        </h1>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                location === item.href
                  ? "bg-slate-50 shadow-sm border border-slate-100"
                  : "hover:bg-slate-50 hover:translate-x-1"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <item.icon className={cn("w-5 h-5", item.color)} />
              <span className={cn(
                "font-medium",
                location === item.href ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
              )}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-slate-50">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-full fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </div>

      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pastel-pink-dark to-pastel-purple-dark bg-clip-text text-transparent">
          NutriCoach
        </h1>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 h-full overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
