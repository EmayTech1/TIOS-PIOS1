import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, ShoppingCart, ChefHat, Trash2,
  Package, UtensilsCrossed, BarChart3, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/compras", label: "Compras", icon: ShoppingCart },
  { path: "/produccion", label: "Produccion", icon: ChefHat },
  { path: "/mermas", label: "Mermas", icon: Trash2 },
  { path: "/materia-prima", label: "Materia Prima", icon: Package },
  { path: "/productos-cocidos", label: "Productos Cocidos", icon: UtensilsCrossed },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <Button
        data-testid="sidebar-toggle"
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-sm border border-border"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        data-testid="sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <h1 className="font-heading text-xl font-bold text-primary tracking-tight">
              TIOS PIOS
            </h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-[0.2em]">
              Sistema de Gestion
            </p>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.path.replace("/", "") || "home"}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors duration-200 ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center tracking-[0.1em]">
              Desarrollado por <span className="font-medium">Emay Tech</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
