import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  raw_material_id: "",
  product_name: "",
  category: "",
  supplier: "",
  quantity: "",
  unit: "",
  unit_price: "",
  total_price: "",
  observation: "",
};

export default function PurchasesPage() {
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [units, setUnits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        axios.get(`${API}/raw-materials`),
        axios.get(`${API}/purchases?limit=50`),
      ]);
      setMaterials(mRes.data);
      setPurchases(pRes.data);
    } catch { toast.error("Error al cargar datos"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onMaterialChange = (matId) => {
    const mat = materials.find((m) => m.id === matId);
    if (mat) {
      setForm((f) => ({ ...f, raw_material_id: matId, product_name: mat.name, category: mat.category, unit: "" }));
      setUnits(mat.conversions || []);
    }
  };

  const onQtyOrPriceChange = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      const qty = parseFloat(next.quantity) || 0;
      const price = parseFloat(next.unit_price) || 0;
      next.total_price = (qty * price).toFixed(2);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.raw_material_id || !form.quantity || !form.unit_price || !form.unit) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    try {
      const payload = {
        ...form,
        quantity: parseFloat(form.quantity),
        unit_price: parseFloat(form.unit_price),
        total_price: parseFloat(form.total_price),
      };
      await axios.post(`${API}/purchases`, payload);
      toast.success("Compra registrada");
      setForm(emptyForm);
      setDialogOpen(false);
      loadData();
    } catch { toast.error("Error al guardar"); }
  };

  const PriceIndicator = ({ purchase }) => {
    if (purchase.price_change_pct == null) return <Minus size={14} className="text-muted-foreground" />;
    if (purchase.price_change_pct > 0) return (
      <span className="flex items-center gap-1 text-[#D90429] text-xs font-medium">
        <TrendingUp size={14} /> +{purchase.price_change_pct}%
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-[#3A5A40] text-xs font-medium">
        <TrendingDown size={14} /> {purchase.price_change_pct}%
      </span>
    );
  };

  const displayDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="page-content" data-testid="purchases-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Registro de Compras</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-purchase-btn" className="bg-primary hover:bg-polleria-primary-hover text-white">
              <Plus size={18} className="mr-2" /> Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Registrar Compra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="form-group">
                <Label className="form-label">Fecha</Label>
                <Input data-testid="purchase-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <Label className="form-label">Producto (Materia Prima)</Label>
                <Select value={form.raw_material_id} onValueChange={onMaterialChange}>
                  <SelectTrigger data-testid="purchase-product-select"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.category})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label className="form-label">Proveedor</Label>
                <Input data-testid="purchase-supplier" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder="Nombre del proveedor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <Label className="form-label">Cantidad</Label>
                  <Input data-testid="purchase-quantity" type="number" step="any" value={form.quantity} onChange={(e) => onQtyOrPriceChange("quantity", e.target.value)} />
                </div>
                <div className="form-group">
                  <Label className="form-label">Unidad</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                    <SelectTrigger data-testid="purchase-unit-select"><SelectValue placeholder="Unidad" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.unit_name} value={u.unit_name}>{u.unit_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <Label className="form-label">Precio Unitario (S/.)</Label>
                  <Input data-testid="purchase-price" type="number" step="any" value={form.unit_price} onChange={(e) => onQtyOrPriceChange("unit_price", e.target.value)} />
                </div>
                <div className="form-group">
                  <Label className="form-label">Precio Total (S/.)</Label>
                  <Input data-testid="purchase-total" readOnly value={form.total_price} className="bg-muted" />
                </div>
              </div>
              <div className="form-group">
                <Label className="form-label">Observacion</Label>
                <Textarea data-testid="purchase-observation" value={form.observation} onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button data-testid="save-purchase-btn" onClick={handleSubmit} className="bg-primary hover:bg-polleria-primary-hover text-white">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {purchases.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground/40 mb-3" />
          <p>No hay compras registradas aun</p>
          <p className="text-sm mt-1">Haz clic en "Nueva Compra" para comenzar</p>
        </div>
      ) : (
        <Card className="table-container">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs uppercase tracking-wide">Fecha</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Producto</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Proveedor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Cant.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">P. Unit.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Total</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id} className="hover:bg-secondary/50 transition-colors" data-testid={`purchase-row-${p.id}`}>
                    <TableCell className="text-sm">{displayDate(p.date)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{p.product_name}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{p.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.supplier || "-"}</TableCell>
                    <TableCell className="text-sm">{p.quantity} {p.unit}</TableCell>
                    <TableCell className="text-sm">S/. {p.unit_price?.toFixed(2)}</TableCell>
                    <TableCell className="text-sm font-medium">S/. {p.total_price?.toFixed(2)}</TableCell>
                    <TableCell><PriceIndicator purchase={p} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
