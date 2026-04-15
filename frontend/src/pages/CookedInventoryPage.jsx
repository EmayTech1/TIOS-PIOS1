import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = ["Platos Principales", "Guarniciones", "Combos", "Otros"];

export default function CookedInventoryPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "" });
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/cooked-products`);
      setProducts(res.data);
    } catch { toast.error("Error al cargar productos"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setForm({ name: "", category: "" });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category) {
      toast.error("Completa nombre y categoria");
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API}/cooked-products/${editId}`, form);
        toast.success("Producto actualizado");
      } else {
        await axios.post(`${API}/cooked-products`, form);
        toast.success("Producto creado");
      }
      setDialogOpen(false);
      loadData();
    } catch { toast.error("Error al guardar"); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/cooked-products/${id}`);
      toast.success("Producto eliminado");
      loadData();
    } catch { toast.error("Error al eliminar"); }
  };

  const displayDate = (d) => {
    if (!d) return "Sin produccion";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="page-content" data-testid="cooked-inventory-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Inventario de Productos Cocidos</h1>
        <Button data-testid="add-cooked-product-btn" onClick={openCreate} className="bg-primary hover:bg-polleria-primary-hover text-white">
          <Plus size={18} className="mr-2" /> Nuevo Producto
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{editId ? "Editar" : "Nuevo"} Producto Cocido</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="form-group">
              <Label className="form-label">Nombre</Label>
              <Input data-testid="cooked-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Pollo a la brasa entero" />
            </div>
            <div className="form-group">
              <Label className="form-label">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger data-testid="cooked-category"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button data-testid="save-cooked-btn" onClick={handleSubmit} className="bg-primary hover:bg-polleria-primary-hover text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {products.length === 0 ? (
        <div className="empty-state">
          <UtensilsCrossed size={48} className="mx-auto text-muted-foreground/40 mb-3" />
          <p>No hay productos cocidos registrados</p>
          <p className="text-sm mt-1">Agrega productos como "Pollo a la brasa", "Porcion de chaufa", etc.</p>
        </div>
      ) : (
        <Card className="table-container">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs uppercase tracking-wide">Producto</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Categoria</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Stock Actual</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Costo Est.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Ultima Produccion</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Estado</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide w-20">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-secondary/50 transition-colors" data-testid={`cooked-row-${p.id}`}>
                    <TableCell className="text-sm font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">{p.stock || 0} und.</TableCell>
                    <TableCell className="text-sm">S/. {(p.estimated_cost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{displayDate(p.last_production_date)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${(p.stock || 0) > 0 ? "bg-[#3A5A40] text-white" : "bg-muted text-muted-foreground"}`}>
                        {(p.stock || 0) > 0 ? "Disponible" : "Sin stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-7 w-7" data-testid={`edit-cooked-${p.id}`}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-7 w-7 text-destructive" data-testid={`delete-cooked-${p.id}`}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
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
