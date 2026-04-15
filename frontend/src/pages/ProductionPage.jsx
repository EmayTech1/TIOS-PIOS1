import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, ChefHat, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductionPage() {
  const [cookedProducts, setCookedProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [productions, setProductions] = useState([]);
  const [prodForm, setProdForm] = useState({ date: new Date().toISOString().split("T")[0], cooked_product_id: "", recipe_id: "", product_name: "", quantity: "", observation: "" });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [recipeForm, setRecipeForm] = useState({ name: "", cooked_product_id: "", cooked_product_name: "", yield_quantity: "1", ingredients: [{ raw_material_id: "", raw_material_name: "", quantity: "", unit: "" }] });

  const loadData = useCallback(async () => {
    try {
      const [cp, rm, rec, prod] = await Promise.all([
        axios.get(`${API}/cooked-products`),
        axios.get(`${API}/raw-materials`),
        axios.get(`${API}/recipes`),
        axios.get(`${API}/productions?limit=50`),
      ]);
      setCookedProducts(cp.data);
      setRawMaterials(rm.data);
      setRecipes(rec.data);
      setProductions(prod.data);
    } catch { toast.error("Error al cargar datos"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onCookedProductChange = (cpId) => {
    const cp = cookedProducts.find((c) => c.id === cpId);
    const recipe = recipes.find((r) => r.cooked_product_id === cpId);
    setProdForm((f) => ({
      ...f,
      cooked_product_id: cpId,
      product_name: cp?.name || "",
      recipe_id: recipe?.id || "",
    }));
    setSelectedRecipe(recipe || null);
  };

  const handleProduction = async () => {
    if (!prodForm.cooked_product_id || !prodForm.recipe_id || !prodForm.quantity) {
      toast.error("Selecciona producto, receta y cantidad");
      return;
    }
    try {
      await axios.post(`${API}/productions`, {
        ...prodForm,
        quantity: parseFloat(prodForm.quantity),
      });
      toast.success("Produccion registrada");
      setProdForm({ date: new Date().toISOString().split("T")[0], cooked_product_id: "", recipe_id: "", product_name: "", quantity: "", observation: "" });
      setSelectedRecipe(null);
      setProdDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al registrar");
    }
  };

  // Recipe form handlers
  const onRecipeCookedChange = (cpId) => {
    const cp = cookedProducts.find((c) => c.id === cpId);
    setRecipeForm((f) => ({ ...f, cooked_product_id: cpId, cooked_product_name: cp?.name || "" }));
  };

  const updateIngredient = (idx, field, value) => {
    setRecipeForm((f) => {
      const ings = [...f.ingredients];
      ings[idx] = { ...ings[idx], [field]: value };
      if (field === "raw_material_id") {
        const rm = rawMaterials.find((m) => m.id === value);
        if (rm) {
          ings[idx].raw_material_name = rm.name;
          ings[idx].unit = rm.conversions?.[0]?.unit_name || rm.unit_base;
        }
      }
      return { ...f, ingredients: ings };
    });
  };

  const addIngredientRow = () => {
    setRecipeForm((f) => ({ ...f, ingredients: [...f.ingredients, { raw_material_id: "", raw_material_name: "", quantity: "", unit: "" }] }));
  };

  const removeIngredientRow = (idx) => {
    setRecipeForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const handleSaveRecipe = async () => {
    if (!recipeForm.name || !recipeForm.cooked_product_id || recipeForm.ingredients.length === 0) {
      toast.error("Completa nombre, producto y al menos 1 ingrediente");
      return;
    }
    const payload = {
      ...recipeForm,
      yield_quantity: parseFloat(recipeForm.yield_quantity) || 1,
      ingredients: recipeForm.ingredients.filter((i) => i.raw_material_id).map((i) => ({ ...i, quantity: parseFloat(i.quantity) || 0 })),
    };
    try {
      await axios.post(`${API}/recipes`, payload);
      toast.success("Receta creada");
      setRecipeForm({ name: "", cooked_product_id: "", cooked_product_name: "", yield_quantity: "1", ingredients: [{ raw_material_id: "", raw_material_name: "", quantity: "", unit: "" }] });
      setRecipeDialogOpen(false);
      loadData();
    } catch { toast.error("Error al guardar receta"); }
  };

  const deleteRecipe = async (id) => {
    try {
      await axios.delete(`${API}/recipes/${id}`);
      toast.success("Receta eliminada");
      loadData();
    } catch { toast.error("Error al eliminar"); }
  };

  const displayDate = (d) => { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

  const getUnitsForMaterial = (matId) => {
    const rm = rawMaterials.find((m) => m.id === matId);
    return rm?.conversions || [];
  };

  return (
    <div className="page-content" data-testid="production-page">
      <h1 className="page-title">Produccion</h1>

      <Tabs defaultValue="produccion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="produccion" data-testid="tab-produccion">
            <ChefHat size={16} className="mr-2" /> Registrar Produccion
          </TabsTrigger>
          <TabsTrigger value="recetas" data-testid="tab-recetas">
            <BookOpen size={16} className="mr-2" /> Gestionar Recetas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produccion" className="space-y-4">
          <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-production-btn" className="bg-primary hover:bg-polleria-primary-hover text-white">
                <Plus size={18} className="mr-2" /> Registrar Produccion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">Nueva Produccion</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="form-group">
                  <Label className="form-label">Fecha</Label>
                  <Input data-testid="production-date" type="date" value={prodForm.date} onChange={(e) => setProdForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <Label className="form-label">Producto Cocido</Label>
                  <Select value={prodForm.cooked_product_id} onValueChange={onCookedProductChange}>
                    <SelectTrigger data-testid="production-product-select"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {cookedProducts.map((cp) => <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {prodForm.cooked_product_id && !selectedRecipe && (
                  <div className="p-3 rounded-md bg-[#F4A261]/10 border border-[#F4A261]/20 text-sm text-[#9D0208]">
                    No hay receta configurada para este producto. Crea una en la pestana "Gestionar Recetas".
                  </div>
                )}
                {selectedRecipe && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Receta: {selectedRecipe.name}</p>
                      <div className="space-y-1">
                        {selectedRecipe.ingredients?.map((ing, i) => (
                          <p key={i} className="text-sm">{ing.raw_material_name}: {ing.quantity} {ing.unit}</p>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Rinde: {selectedRecipe.yield_quantity} porcion(es)</p>
                    </CardContent>
                  </Card>
                )}
                <div className="form-group">
                  <Label className="form-label">Cantidad a Producir</Label>
                  <Input data-testid="production-quantity" type="number" step="any" value={prodForm.quantity} onChange={(e) => setProdForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="form-group">
                  <Label className="form-label">Observacion</Label>
                  <Textarea data-testid="production-observation" value={prodForm.observation} onChange={(e) => setProdForm((f) => ({ ...f, observation: e.target.value }))} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button data-testid="save-production-btn" onClick={handleProduction} disabled={!selectedRecipe} className="bg-primary hover:bg-polleria-primary-hover text-white">Producir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {productions.length === 0 ? (
            <div className="empty-state"><ChefHat size={48} className="mx-auto text-muted-foreground/40 mb-3" /><p>No hay producciones registradas</p></div>
          ) : (
            <Card className="table-container">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs uppercase tracking-wide">Fecha</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Producto</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Cantidad</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Costo</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productions.map((p) => (
                      <TableRow key={p.id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell className="text-sm">{displayDate(p.date)}</TableCell>
                        <TableCell className="text-sm font-medium">{p.product_name}</TableCell>
                        <TableCell className="text-sm">{p.quantity}</TableCell>
                        <TableCell className="text-sm">S/. {p.total_cost?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.observation || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recetas" className="space-y-4">
          <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-recipe-btn" className="bg-primary hover:bg-polleria-primary-hover text-white">
                <Plus size={18} className="mr-2" /> Nueva Receta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Crear Receta</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <Label className="form-label">Nombre de Receta</Label>
                    <Input data-testid="recipe-name" value={recipeForm.name} onChange={(e) => setRecipeForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Pollo a la brasa" />
                  </div>
                  <div className="form-group">
                    <Label className="form-label">Producto Cocido</Label>
                    <Select value={recipeForm.cooked_product_id} onValueChange={onRecipeCookedChange}>
                      <SelectTrigger data-testid="recipe-product-select"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {cookedProducts.map((cp) => <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="form-group">
                  <Label className="form-label">Rendimiento (porciones por receta)</Label>
                  <Input data-testid="recipe-yield" type="number" step="any" value={recipeForm.yield_quantity} onChange={(e) => setRecipeForm((f) => ({ ...f, yield_quantity: e.target.value }))} />
                </div>
                <div>
                  <Label className="form-label mb-2 block">Ingredientes</Label>
                  <div className="space-y-2">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Select value={ing.raw_material_id} onValueChange={(v) => updateIngredient(idx, "raw_material_id", v)}>
                            <SelectTrigger data-testid={`recipe-ing-material-${idx}`}><SelectValue placeholder="Material" /></SelectTrigger>
                            <SelectContent>
                              {rawMaterials.map((rm) => <SelectItem key={rm.id} value={rm.id}>{rm.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input data-testid={`recipe-ing-qty-${idx}`} type="number" step="any" placeholder="Cant." value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", e.target.value)} />
                        </div>
                        <div className="col-span-3">
                          <Select value={ing.unit} onValueChange={(v) => updateIngredient(idx, "unit", v)}>
                            <SelectTrigger data-testid={`recipe-ing-unit-${idx}`}><SelectValue placeholder="Und" /></SelectTrigger>
                            <SelectContent>
                              {getUnitsForMaterial(ing.raw_material_id).map((u) => <SelectItem key={u.unit_name} value={u.unit_name}>{u.unit_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="icon" onClick={() => removeIngredientRow(idx)} className="text-destructive h-9 w-9">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addIngredientRow} className="mt-2" data-testid="add-ingredient-btn">
                    <Plus size={14} className="mr-1" /> Agregar Ingrediente
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button data-testid="save-recipe-btn" onClick={handleSaveRecipe} className="bg-primary hover:bg-polleria-primary-hover text-white">Guardar Receta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {recipes.length === 0 ? (
            <div className="empty-state"><BookOpen size={48} className="mx-auto text-muted-foreground/40 mb-3" /><p>No hay recetas creadas</p></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recipes.map((r) => (
                <Card key={r.id} data-testid={`recipe-card-${r.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-heading">{r.name}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => deleteRecipe(r.id)} className="text-destructive h-8 w-8" data-testid={`delete-recipe-${r.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs">{r.cooked_product_name}</Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-2">Rinde: {r.yield_quantity} porcion(es)</p>
                    <div className="space-y-1">
                      {r.ingredients?.map((ing, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {ing.raw_material_name}: <span className="text-foreground font-medium">{ing.quantity} {ing.unit}</span>
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
