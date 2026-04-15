import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const reasons = [
  "Vencimiento",
  "Dano en almacenamiento",
  "Error en preparacion",
  "Sobrante del dia",
  "Producto defectuoso",
  "Otro",
];

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  inventory_type: "",
  product_id: "",
  product_name: "",
  category: "",
  quantity: "",
  unit: "",
  reason: "",
  estimated_cost: "",
  observation: "",
};

export default function WastePage() {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [cookedProducts, setCookedProducts] = useState([]);
  const [wastes, setWastes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [rm, cp, w] = await Promise.all([
        axios.get(`${API}/raw-materials`),
        axios.get(`${API}/cooked-products`),
        axios.get(`${API}/wastes?limit=50`),
      ]);
      setRawMaterials(rm.data);
      setCookedProducts(cp.data);
      setWastes(w.data);
    } catch { toast.error("Error al cargar datos"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onTypeChange = (type) => {
    setForm((f) => ({ ...f, inventory_type: type, product_id: "", product_name: "", category: "", unit: "" }));
    if (type === "materia_prima") {
      setProducts(rawMaterials.map((m) => ({ id: m.id, name: m.name, category: m.category, conversions: m.conversions, unit_base: m.unit_base, avg_cost: m.avg_cost })));
    } else {
      setProducts(cookedProducts.map((c) => ({ id: c.id, name: c.name, category: c.category, conversions: [{ unit_name: "unidad", factor: 1 }], unit_base: "unidad", avg_cost: c.estimated_cost })));
    }
  };

  const onProductChange = (prodId) => {
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setForm((f) => ({ ...f, product_id: prodId, product_name: prod.name, category: prod.category || "" }));
      setUnits(prod.conversions || []);
    }
  };

  const calcEstimatedCost = (qty, unitName) => {
    const prod = products.find((p) => p.id === form.product_id);
    if (!prod) return 0;
    const conv = (prod.conversions || []).find((c) => c.unit_name === unitName);
    const factor = conv?.factor || 1;
    return (parseFloat(qty) || 0) * factor * (prod.avg_cost || 0);
  };

  const onQtyChange = (val) => {
    const cost = calcEstimatedCost(val, form.unit);
    setForm((f) => ({ ...f, quantity: val, estimated_cost: cost.toFixed(2) }));
  };

  const onUnitChange = (val) => {
    const cost = calcEstimatedCost(form.quantity, val);
    setForm((f) => ({ ...f, unit: val, estimated_cost: cost.toFixed(2) }));
  };

  const handleSubmit = async () => {
    if (!form.inventory_type || !form.product_id || !form.quantity || !form.unit || !form.reason) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    try {
      await axios.post(`${API}/wastes`, {
        ...form,
        quantity: parseFloat(form.quantity),
        estimated_cost: parseFloat(form.estimated_cost) || 0,
      });
      toast.success("Merma registrada");
      setForm(emptyForm);
      setDialogOpen(false);
      loadData();
    } catch { toast.error("Error al registrar merma"); }
  };

  const displayDate = (d) => { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

  return (
    <div className="page-content" data-testid="waste-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Registro de Mermas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-waste-btn" className="bg-primary hover:bg-polleria-primary-hover text-white">
              <Plus size={18} className="mr-2" /> Nueva Merma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Registrar Merma</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="form-group">
                <Label className="form-label">Fecha</Label>
                <Input data-testid="waste-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <Label className="form-label">Tipo de Inventario</Label>
                <Select value={form.inventory_type} onValueChange={onTypeChange}>
                  <SelectTrigger data-testid="waste-type-select"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materia_prima">Materia Prima</SelectItem>
                    <SelectItem value="cocido">Producto Cocido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.inventory_type && (
                <div className="form-group">
                  <Label className="form-label">Producto</Label>
                  <Select value={form.product_id} onValueChange={onProductChange}>
                    <SelectTrigger data-testid="waste-product-select"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <Label className="form-label">Cantidad</Label>
                  <Input data-testid="waste-quantity" type="number" step="any" value={form.quantity} onChange={(e) => onQtyChange(e.target.value)} />
                </div>
                <div className="form-group">
                  <Label className="form-label">Unidad</Label>
                  <Select value={form.unit} onValueChange={onUnitChange}>
                    <SelectTrigger data-testid="waste-unit-select"><SelectValue placeholder="Unidad" /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => <SelectItem key={u.unit_name} value={u.unit_name}>{u.unit_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="form-group">
                <Label className="form-label">Motivo</Label>
                <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}>
                  <SelectTrigger data-testid="waste-reason-select"><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                  <SelectContent>
                    {reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label className="form-label">Costo Estimado Perdido (S/.)</Label>
                <Input data-testid="waste-cost" type="number" step="any" value={form.estimated_cost} onChange={(e) => setForm((f) => ({ ...f, estimated_cost: e.target.value }))} />
              </div>
              <div className="form-group">
                <Label className="form-label">Observacion</Label>
                <Textarea data-testid="waste-observation" value={form.observation} onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button data-testid="save-waste-btn" onClick={handleSubmit} className="bg-primary hover:bg-polleria-primary-hover text-white">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {wastes.length === 0 ? (
        <div className="empty-state"><Trash2 size={48} className="mx-auto text-muted-foreground/40 mb-3" /><p>No hay mermas registradas</p></div>
      ) : (
        <Card className="table-container">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs uppercase tracking-wide">Fecha</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Tipo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Producto</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Cant.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Motivo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wastes.map((w) => (
                  <TableRow key={w.id} className="hover:bg-secondary/50 transition-colors">
                    <TableCell className="text-sm">{displayDate(w.date)}</TableCell>
                    <TableCell>
                      <Badge variant={w.inventory_type === "materia_prima" ? "outline" : "secondary"} className="text-xs">
                        {w.inventory_type === "materia_prima" ? "M. Prima" : "Cocido"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{w.product_name}</TableCell>
                    <TableCell className="text-sm">{w.quantity} {w.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w.reason}</TableCell>
                    <TableCell className="text-sm font-medium text-[#D90429]">S/. {w.estimated_cost?.toFixed(2)}</TableCell>
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
