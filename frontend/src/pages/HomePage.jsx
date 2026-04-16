import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ShoppingCart, ChefHat, Trash2, Package,
  UtensilsCrossed, BarChart3, TrendingDown, AlertTriangle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const quickLinks = [
  { path: "/compras", label: "Registro de Compras", desc: "Registrar compras del dia", icon: ShoppingCart, color: "text-[#E85D04]", bg: "bg-[#E85D04]/10" },
  { path: "/produccion", label: "Produccion", desc: "Registrar produccion diaria", icon: ChefHat, color: "text-[#9D0208]", bg: "bg-[#9D0208]/10" },
  { path: "/mermas", label: "Mermas", desc: "Registrar mermas y perdidas", icon: Trash2, color: "text-[#D90429]", bg: "bg-[#D90429]/10" },
  { path: "/materia-prima", label: "Materia Prima", desc: "Inventario de insumos", icon: Package, color: "text-[#3A5A40]", bg: "bg-[#3A5A40]/10" },
  { path: "/productos-cocidos", label: "Productos Cocidos", desc: "Productos preparados", icon: UtensilsCrossed, color: "text-[#F4A261]", bg: "bg-[#F4A261]/20" },
  { path: "/dashboard", label: "Dashboard", desc: "Indicadores y reportes", icon: BarChart3, color: "text-[#57534E]", bg: "bg-[#57534E]/10" },
];

export default function HomePage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    axios.get(`${API}/dashboard/summary`).then(r => setSummary(r.data)).catch(() => {});
  }, []);

  return (
    <div className="page-content" data-testid="home-page">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Bienvenido
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Panel de control de TIOS PIOS. Accede rapidamente a cada modulo.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="stat-card stagger-item">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#E85D04]/10">
                  <ShoppingCart size={18} className="text-[#E85D04]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Compras Hoy</p>
                  <p className="text-lg font-heading font-bold" data-testid="stat-purchases-today">
                    S/. {summary.purchases_today.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card stagger-item">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#3A5A40]/10">
                  <ChefHat size={18} className="text-[#3A5A40]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Produccion Hoy</p>
                  <p className="text-lg font-heading font-bold" data-testid="stat-production-today">
                    {summary.productions_today_count} lotes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card stagger-item">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#D90429]/10">
                  <TrendingDown size={18} className="text-[#D90429]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Mermas Hoy</p>
                  <p className="text-lg font-heading font-bold" data-testid="stat-waste-today">
                    {summary.wastes_today_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card stagger-item">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#F4A261]/20">
                  <AlertTriangle size={18} className="text-[#F4A261]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stock Bajo</p>
                  <p className="text-lg font-heading font-bold" data-testid="stat-low-stock">
                    {summary.low_stock_count} items
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Accesos Rapidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path} data-testid={`quick-link-${link.path.replace("/", "")}`}>
              <Card className="stat-card group cursor-pointer stagger-item hover:border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${link.bg}`}>
                      <Icon size={22} className={link.color} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                        {link.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {summary && summary.low_stock_items && summary.low_stock_items.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Alertas de Stock Bajo</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {summary.low_stock_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-[#D90429]/5 border border-[#D90429]/10">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-[#D90429]">
                      {item.stock?.toFixed(0)} {item.unit_base} (min: {item.stock_min})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
