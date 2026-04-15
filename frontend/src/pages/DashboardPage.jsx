import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ShoppingCart, TrendingDown, TrendingUp, AlertTriangle,
  BarChart3, Lightbulb, ArrowUp, ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KpiCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <Card className="stat-card stagger-item">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${bgColor}`}>
          <Icon size={18} className={color} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-lg font-heading font-bold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API}/dashboard/summary`).then((r) => setData(r.data)).catch(() => toast.error("Error al cargar dashboard"));
  }, []);

  if (!data) return <div className="page-content"><p className="text-muted-foreground">Cargando dashboard...</p></div>;

  const chartData = (data.purchases_by_day || []).map((d) => ({
    date: d.date.slice(5),
    total: d.total,
  }));

  return (
    <div className="page-content" data-testid="dashboard-page">
      <h1 className="page-title">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={ShoppingCart} label="Compras Hoy" value={`S/. ${data.purchases_today.toFixed(2)}`} color="text-[#E85D04]" bgColor="bg-[#E85D04]/10" />
        <KpiCard icon={ShoppingCart} label="Compras Semana" value={`S/. ${data.purchases_week.toFixed(2)}`} color="text-[#DC2F02]" bgColor="bg-[#DC2F02]/10" />
        <KpiCard icon={ShoppingCart} label="Compras Mes" value={`S/. ${data.purchases_month.toFixed(2)}`} color="text-[#9D0208]" bgColor="bg-[#9D0208]/10" />
        <KpiCard icon={TrendingDown} label="Mermas Mes" value={`S/. ${data.wastes_month_cost.toFixed(2)}`} color="text-[#D90429]" bgColor="bg-[#D90429]/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" /> Compras Ultimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(28 38% 85%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(30 5% 32%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(30 5% 32%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1917",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`S/. ${value.toFixed(2)}`, "Total"]}
                  />
                  <Bar dataKey="total" fill="#E85D04" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos de compras</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Productos Mas Comprados</CardTitle>
            </CardHeader>
            <CardContent>
              {data.most_purchased.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos aun</p>
              ) : (
                <div className="space-y-2">
                  {data.most_purchased.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{p.name}</span>
                      <span className="text-sm font-medium">S/. {p.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Productos Mas Producidos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.most_produced.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos aun</p>
              ) : (
                <div className="space-y-2">
                  {data.most_produced.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{p.name}</span>
                      <span className="text-sm font-medium">{p.total} und.</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingUp size={18} className="text-[#F4A261]" /> Variacion de Precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.price_variations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin variaciones significativas</p>
            ) : (
              <div className="space-y-2">
                {data.price_variations.map((pv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                    <span className="text-sm">{pv.product}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">S/. {pv.previous} &rarr; S/. {pv.current}</span>
                      <Badge className={`text-[10px] ${pv.pct > 0 ? "bg-[#D90429] text-white" : "bg-[#3A5A40] text-white"}`}>
                        {pv.pct > 0 ? <ArrowUp size={10} className="mr-0.5" /> : <ArrowDown size={10} className="mr-0.5" />}
                        {Math.abs(pv.pct)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#D90429]" /> Mayores Mermas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_waste.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin mermas registradas</p>
            ) : (
              <div className="space-y-2">
                {data.top_waste.map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-[#D90429]/5">
                    <span className="text-sm">{w.name}</span>
                    <span className="text-sm font-medium text-[#D90429]">S/. {w.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Lightbulb size={18} className="text-[#F4A261]" /> Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recommendations.map((r, i) => (
                <div
                  key={i}
                  data-testid={`recommendation-${i}`}
                  className={`py-2.5 px-4 rounded-md text-sm border ${
                    r.severity === "critical"
                      ? "bg-[#D90429]/5 border-[#D90429]/20 text-[#9D0208]"
                      : r.severity === "warning"
                      ? "bg-[#F4A261]/10 border-[#F4A261]/20 text-[#57534E]"
                      : "bg-muted/50 border-border text-muted-foreground"
                  }`}
                >
                  {r.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.low_stock_count > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#F4A261]" /> Stock Bajo ({data.low_stock_count} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.low_stock_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-md bg-[#F4A261]/10">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-[#9D0208]">
                    {item.stock?.toFixed(0)} {item.unit_base} (min: {item.stock_min})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
