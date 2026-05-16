import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, FileText, Users, BookOpen,
  Target, MessageSquare, FolderOpen, ChevronLeft, ChevronRight, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/meetings", label: "Meetings", icon: Calendar },
  { path: "/documents", label: "Documents", icon: FolderOpen },
  { path: "/members", label: "Board Members", icon: Users },
  { path: "/onboarding", label: "Onboarding", icon: BookOpen },
  { path: "/strategic-plan", label: "Strategic Plan", icon: Target },
  { path: "/board-assistant", label: "Board Assistant", icon: MessageSquare },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        {!collapsed && (
          <div>
            <h1 className="font-heading text-lg font-semibold text-white leading-tight">BoardRoom</h1>
            <p className="text-xs text-sidebar-foreground/60">Governance Platform</p>
          </div>
        )}
        {collapsed && <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">B</div>}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-accent text-white font-medium"
                  : "text-sidebar-foreground hover:bg-primary hover:text-white"
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent text-xs transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transition-transform duration-200 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-slate-900 transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu size={20} />
          </button>
          <h1 className="font-heading font-semibold text-foreground">BoardRoom</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}