import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  "Pollo", "Verduras", "Papa", "Arroces y Granos",
  "Condimentos", "Aceites y Liquidos", "Cremas y Salsas",
  "Envases y Descartables", "Otros",
];

const UNIT_BASES = [
  { value: "g", label: "Gramos (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "unidad", label: "Unidad" },
];

const emptyForm = { name: "", category: "", unit_base: "", stock: "0", stock_min: "0", avg_cost: "0", conversions: [] };

export default function RawInventoryPage() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [customConversions, setCustomConversions] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/raw-materials`);
      setMaterials(res.data);
    } catch { toast.error("Error al cargar materiales"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setCustomConversions([]);
    setDialogOpen(true);
  };

  const openEdit = (m) => {
    setForm({ name: m.name, category: m.category, unit_base: m.unit_base, stock: String(m.stock), stock_min: String(m.stock_min), avg_cost: String(m.avg_cost), conversions: m.conversions || [] });
    setEditId(m.id);
    const defaults = m.unit_base === "g" ? ["g", "kg"] : m.unit_base === "ml" ? ["ml", "litro"] : ["unidad"];
    setCustomConversions((m.conversions || []).filter((c) => !defaults.includes(c.unit_name)));
    setDialogOpen(true);
  };

  const addCustomConversion = () => {
    setCustomConversions((c) => [...c, { unit_name: "", factor: "" }]);
  };

  const updateCustomConversion = (idx, field, value) => {
    setCustomConversions((c) => { const n = [...c]; n[idx] = { ...n[idx], [field]: value }; return n; });
  };

  const removeCustomConversion = (idx) => {
    setCustomConversions((c) => c.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.unit_base) {
      toast.error("Completa nombre, categoria y unidad base");
      return;
    }
    // Build conversions
    let convs = [];
    if (form.unit_base === "g") convs = [{ unit_name: "g", factor: 1 }, { unit_name: "kg", factor: 1000 }];
    else if (form.unit_base === "ml") convs = [{ unit_name: "ml", factor: 1 }, { unit_name: "litro", factor: 1000 }];
    else convs = [{ unit_name: "unidad", factor: 1 }];
    customConversions.forEach((c) => {
      if (c.unit_name && c.factor) convs.push({ unit_name: c.unit_name, factor: parseFloat(c.factor) });
    });

    const payload = {
      name: form.name,
      category: form.category,
      unit_base: form.unit_base,
      stock: parseFloat(form.stock) || 0,
      stock_min: parseFloat(form.stock_min) || 0,
      avg_cost: parseFloat(form.avg_cost) || 0,
      conversions: convs,
    };

    try {
      if (editId) {
        await axios.put(`${API}/raw-materials/${editId}`, payload);
        toast.success("Material actualizado");
      } else {
        await axios.post(`${API}/raw-materials`, payload);
        toast.success("Material creado");
      }
      setDialogOpen(false);
      loadData();
    } catch { toast.error("Error al guardar"); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/raw-materials/${id}`);
      toast.success("Material eliminado");
      loadData();
    } catch { toast.error("Error al eliminar"); }
  };

  const getStatus = (m) => {
    if (m.stock_min > 0 && m.stock <= 0) return { label: "Sin Stock", color: "bg-[#D90429] text-white" };
    if (m.stock_min > 0 && m.stock <= m.stock_min) return { label: "Bajo", color: "bg-[#F4A261] text-white" };
    return { label: "OK", color: "bg-[#3A5A40] text-white" };
  };

  const formatStock = (stock, unit) => {
    if (unit === "g" && stock >= 1000) return `${(stock / 1000).toFixed(2)} kg`;
    if (unit === "ml" && stock >= 1000) return `${(stock / 1000).toFixed(2)} L`;
    return `${stock.toFixed(0)} ${unit}`;
  };

  const filtered = filterCat === "all" ? materials : materials.filter((m) => m.category === filterCat);

  return (
    <div className="page-content" data-testid="raw-inventory-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="page-title mb-0">Inventario de Materia Prima</h1>
        <div className="flex items-center gap-3">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[200px]" data-testid="filter-category">
              <SelectValue placeholder="Filtrar categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button data-testid="add-material-btn" onClick={openCreate} className="bg-primary hover:bg-polleria-primary-hover text-white">
            <Plus size={18} className="mr-2" /> Nuevo Material
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editId ? "Editar" : "Nuevo"} Material</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="form-group">
              <Label className="form-label">Nombre</Label>
              <Input data-testid="material-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Pollo entero" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <Label className="form-label">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="material-category"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label className="form-label">Unidad Base</Label>
                <Select value={form.unit_base} onValueChange={(v) => setForm((f) => ({ ...f, unit_base: v }))}>
                  <SelectTrigger data-testid="material-unit-base"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{UNIT_BASES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <Label className="form-label">Stock Minimo</Label>
                <Input data-testid="material-stock-min" type="number" step="any" value={form.stock_min} onChange={(e) => setForm((f) => ({ ...f, stock_min: e.target.value }))} />
              </div>
              <div className="form-group">
                <Label className="form-label">Stock Actual</Label>
                <Input data-testid="material-stock" type="number" step="any" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="form-label mb-2 block">Conversiones Personalizadas</Label>
              <p className="text-xs text-muted-foreground mb-2">Las conversiones basicas (kg/g, litro/ml) se agregan automaticamente</p>
              {customConversions.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <div className="col-span-5">
                    <Input placeholder="Ej: caja" value={c.unit_name} onChange={(e) => updateCustomConversion(i, "unit_name", e.target.value)} />
                  </div>
                  <div className="col-span-1 text-center text-sm text-muted-foreground">=</div>
                  <div className="col-span-4">
                    <Input type="number" placeholder="Factor" value={c.factor} onChange={(e) => updateCustomConversion(i, "factor", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Button variant="ghost" size="icon" onClick={() => removeCustomConversion(i)} className="text-destructive h-8 w-8">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCustomConversion} className="mt-1" data-testid="add-conversion-btn">
                <Plus size={14} className="mr-1" /> Conversion
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button data-testid="save-material-btn" onClick={handleSubmit} className="bg-primary hover:bg-polleria-primary-hover text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <div className="empty-state"><Package size={48} className="mx-auto text-muted-foreground/40 mb-3" /><p>No hay materiales registrados</p></div>
      ) : (
        <Card className="table-container">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs uppercase tracking-wide">Producto</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Categoria</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Stock</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Costo Prom.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Min</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Estado</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide w-20">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const status = getStatus(m);
                  return (
                    <TableRow key={m.id} className="hover:bg-secondary/50 transition-colors" data-testid={`material-row-${m.id}`}>
                      <TableCell className="text-sm font-medium">{m.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.category}</Badge></TableCell>
                      <TableCell className="text-sm">{formatStock(m.stock || 0, m.unit_base)}</TableCell>
                      <TableCell className="text-sm">S/. {(m.avg_cost || 0).toFixed(4)}/{m.unit_base}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.stock_min} {m.unit_base}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)} className="h-7 w-7" data-testid={`edit-material-${m.id}`}>
                            <Pencil size={13} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-7 w-7 text-destructive" data-testid={`delete-material-${m.id}`}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
