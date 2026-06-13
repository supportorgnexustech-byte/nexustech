import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  KanbanSquare, 
  Cpu, 
  FileText, 
  Calculator, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  User as UserIcon,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "dev"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["admin"] },
  { name: "Projects", href: "/projects", icon: Briefcase, roles: ["admin", "dev"] },
  { name: "Kanban", href: "/kanban", icon: KanbanSquare, roles: ["admin", "dev"] },
  { name: "Resources", href: "/resources", icon: Cpu, roles: ["admin", "dev"] },
  { name: "Invoices", href: "/invoices", icon: FileText, roles: ["admin", "client"] },
  { name: "Pricing AI", href: "/pricing", icon: Calculator, roles: ["admin"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin"] },
  { name: "Users", href: "/users", icon: Settings, roles: ["admin"] },
  { name: "Client Portal", href: "/client-portal", icon: LayoutDashboard, roles: ["client"] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const [location] = useLocation();

  if (!currentUser) return <>{children}</>;

  const filteredNav = navItems.filter((item) => item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-border">
            <div className="bg-primary/20 p-2 rounded-md border border-primary/30">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-foreground">NEXUS</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Operations</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border",
                      isActive 
                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm shadow-primary/5" 
                        : "text-muted-foreground border-transparent hover:bg-white/5 hover:text-foreground hover:border-white/5"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground capitalize font-mono">{currentUser.role}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-white border-white/10 hover:border-white/20 bg-transparent hover:bg-white/5"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="md:hidden font-bold text-lg">NEXUS</div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="block">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-card" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
