from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class ConversionUnit(BaseModel):
    unit_name: str
    factor: float

class RawMaterialCreate(BaseModel):
    name: str
    category: str
    unit_base: str
    stock: float = 0
    stock_min: float = 0
    avg_cost: float = 0
    conversions: List[ConversionUnit] = []

class CookedProductCreate(BaseModel):
    name: str
    category: str

class RecipeIngredient(BaseModel):
    raw_material_id: str
    raw_material_name: str
    quantity: float
    unit: str

class RecipeCreate(BaseModel):
    name: str
    cooked_product_id: str
    cooked_product_name: str
    ingredients: List[RecipeIngredient]
    yield_quantity: float = 1

class PurchaseCreate(BaseModel):
    date: str
    raw_material_id: str
    product_name: str
    category: str
    supplier: str = ""
    quantity: float
    unit: str
    unit_price: float
    total_price: float
    observation: str = ""

class ProductionCreate(BaseModel):
    date: str
    recipe_id: str
    cooked_product_id: str
    product_name: str
    quantity: float
    observation: str = ""

class WasteCreate(BaseModel):
    date: str
    inventory_type: str
    product_id: str
    product_name: str
    category: str = ""
    quantity: float
    unit: str
    reason: str
    estimated_cost: float = 0
    observation: str = ""

# ==================== HELPERS ====================

def make_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def get_conversion_factor(conversions, unit, unit_base):
    for conv in conversions:
        if conv.get("unit_name", "") == unit:
            return conv["factor"]
    defaults = {
        "g": {"g": 1, "kg": 1000},
        "ml": {"ml": 1, "litro": 1000},
        "unidad": {"unidad": 1}
    }
    return defaults.get(unit_base, {}).get(unit, 1)

# ==================== RAW MATERIALS ====================

@api_router.get("/raw-materials")
async def get_raw_materials():
    return await db.raw_materials.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/raw-materials")
async def create_raw_material(data: RawMaterialCreate):
    doc = data.model_dump()
    doc["id"] = make_id()
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    if not doc["conversions"]:
        if doc["unit_base"] == "g":
            doc["conversions"] = [{"unit_name": "g", "factor": 1}, {"unit_name": "kg", "factor": 1000}]
        elif doc["unit_base"] == "ml":
            doc["conversions"] = [{"unit_name": "ml", "factor": 1}, {"unit_name": "litro", "factor": 1000}]
        else:
            doc["conversions"] = [{"unit_name": "unidad", "factor": 1}]
    await db.raw_materials.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/raw-materials/{item_id}")
async def update_raw_material(item_id: str, data: RawMaterialCreate):
    update_data = data.model_dump()
    update_data["updated_at"] = now_iso()
    result = await db.raw_materials.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No encontrado")
    doc = await db.raw_materials.find_one({"id": item_id}, {"_id": 0})
    return doc

@api_router.delete("/raw-materials/{item_id}")
async def delete_raw_material(item_id: str):
    result = await db.raw_materials.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"message": "Eliminado"}

# ==================== COOKED PRODUCTS ====================

@api_router.get("/cooked-products")
async def get_cooked_products():
    return await db.cooked_products.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/cooked-products")
async def create_cooked_product(data: CookedProductCreate):
    doc = data.model_dump()
    doc["id"] = make_id()
    doc["stock"] = 0
    doc["estimated_cost"] = 0
    doc["last_production_date"] = None
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.cooked_products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/cooked-products/{item_id}")
async def update_cooked_product(item_id: str, data: CookedProductCreate):
    update_data = data.model_dump()
    update_data["updated_at"] = now_iso()
    result = await db.cooked_products.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No encontrado")
    doc = await db.cooked_products.find_one({"id": item_id}, {"_id": 0})
    return doc

@api_router.delete("/cooked-products/{item_id}")
async def delete_cooked_product(item_id: str):
    result = await db.cooked_products.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"message": "Eliminado"}

# ==================== RECIPES ====================

@api_router.get("/recipes")
async def get_recipes():
    return await db.recipes.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/recipes")
async def create_recipe(data: RecipeCreate):
    doc = data.model_dump()
    doc["id"] = make_id()
    doc["created_at"] = now_iso()
    await db.recipes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/recipes/{item_id}")
async def update_recipe(item_id: str, data: RecipeCreate):
    update_data = data.model_dump()
    result = await db.recipes.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No encontrada")
    doc = await db.recipes.find_one({"id": item_id}, {"_id": 0})
    return doc

@api_router.delete("/recipes/{item_id}")
async def delete_recipe(item_id: str):
    result = await db.recipes.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No encontrada")
    return {"message": "Eliminada"}

# ==================== PURCHASES ====================

@api_router.get("/purchases")
async def get_purchases(date: Optional[str] = None, limit: int = 100):
    query = {}
    if date:
        query["date"] = date
    return await db.purchases.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.post("/purchases")
async def create_purchase(data: PurchaseCreate):
    # Previous price lookup
    prev = await db.purchases.find(
        {"raw_material_id": data.raw_material_id},
        {"_id": 0, "unit_price": 1}
    ).sort("created_at", -1).limit(1).to_list(1)

    doc = data.model_dump()
    doc["id"] = make_id()
    doc["created_at"] = now_iso()
    doc["previous_price"] = None
    doc["price_change_pct"] = None

    if prev:
        pp = prev[0].get("unit_price", 0)
        if pp > 0:
            doc["previous_price"] = pp
            doc["price_change_pct"] = round(((data.unit_price - pp) / pp) * 100, 1)

    # Update raw material stock and avg cost
    rm = await db.raw_materials.find_one({"id": data.raw_material_id}, {"_id": 0})
    if rm:
        factor = get_conversion_factor(rm.get("conversions", []), data.unit, rm["unit_base"])
        added = data.quantity * factor
        old_stock = rm.get("stock", 0)
        old_avg = rm.get("avg_cost", 0)
        cpb = data.unit_price / factor if factor > 0 else 0
        new_stock = old_stock + added
        new_avg = (old_stock * old_avg + added * cpb) / new_stock if new_stock > 0 else cpb
        await db.raw_materials.update_one(
            {"id": data.raw_material_id},
            {"$set": {"stock": round(new_stock, 2), "avg_cost": round(new_avg, 6), "updated_at": now_iso()}}
        )

    await db.purchases.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/purchases/price-history/{raw_material_id}")
async def get_price_history(raw_material_id: str):
    return await db.purchases.find(
        {"raw_material_id": raw_material_id},
        {"_id": 0, "date": 1, "unit_price": 1, "unit": 1, "quantity": 1, "total_price": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)

# ==================== PRODUCTIONS ====================

@api_router.get("/productions")
async def get_productions(date: Optional[str] = None, limit: int = 100):
    query = {}
    if date:
        query["date"] = date
    return await db.productions.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.post("/productions")
async def create_production(data: ProductionCreate):
    recipe = await db.recipes.find_one({"id": data.recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    yield_qty = recipe.get("yield_quantity", 1)
    multiplier = data.quantity / yield_qty if yield_qty > 0 else data.quantity

    ingredients_used = []
    total_cost = 0

    for ing in recipe.get("ingredients", []):
        rm = await db.raw_materials.find_one({"id": ing["raw_material_id"]}, {"_id": 0})
        if rm:
            factor = get_conversion_factor(rm.get("conversions", []), ing["unit"], rm["unit_base"])
            deduction = ing["quantity"] * multiplier * factor
            new_stock = max(0, rm.get("stock", 0) - deduction)
            cost = deduction * rm.get("avg_cost", 0)
            total_cost += cost
            await db.raw_materials.update_one(
                {"id": ing["raw_material_id"]},
                {"$set": {"stock": round(new_stock, 2), "updated_at": now_iso()}}
            )
            ingredients_used.append({
                "raw_material_id": ing["raw_material_id"],
                "raw_material_name": ing.get("raw_material_name", ""),
                "quantity_base": round(deduction, 2)
            })

    # Update cooked product stock
    cooked = await db.cooked_products.find_one({"id": data.cooked_product_id}, {"_id": 0})
    if cooked:
        new_stock = cooked.get("stock", 0) + data.quantity
        cpu = total_cost / data.quantity if data.quantity > 0 else 0
        await db.cooked_products.update_one(
            {"id": data.cooked_product_id},
            {"$set": {
                "stock": round(new_stock, 2),
                "estimated_cost": round(cpu, 2),
                "last_production_date": data.date,
                "updated_at": now_iso()
            }}
        )

    doc = data.model_dump()
    doc["id"] = make_id()
    doc["ingredients_used"] = ingredients_used
    doc["total_cost"] = round(total_cost, 2)
    doc["created_at"] = now_iso()

    await db.productions.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== WASTES ====================

@api_router.get("/wastes")
async def get_wastes(date: Optional[str] = None, limit: int = 100):
    query = {}
    if date:
        query["date"] = date
    return await db.wastes.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.post("/wastes")
async def create_waste(data: WasteCreate):
    if data.inventory_type == "materia_prima":
        rm = await db.raw_materials.find_one({"id": data.product_id}, {"_id": 0})
        if rm:
            factor = get_conversion_factor(rm.get("conversions", []), data.unit, rm["unit_base"])
            deduction = data.quantity * factor
            new_stock = max(0, rm.get("stock", 0) - deduction)
            await db.raw_materials.update_one(
                {"id": data.product_id},
                {"$set": {"stock": round(new_stock, 2), "updated_at": now_iso()}}
            )
    elif data.inventory_type == "cocido":
        cp = await db.cooked_products.find_one({"id": data.product_id}, {"_id": 0})
        if cp:
            new_stock = max(0, cp.get("stock", 0) - data.quantity)
            await db.cooked_products.update_one(
                {"id": data.product_id},
                {"$set": {"stock": round(new_stock, 2), "updated_at": now_iso()}}
            )

    doc = data.model_dump()
    doc["id"] = make_id()
    doc["created_at"] = now_iso()
    await db.wastes.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== DASHBOARD ====================

@api_router.get("/dashboard/summary")
async def get_dashboard_summary():
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    month_start = now.strftime("%Y-%m-01")

    purchases_today = await db.purchases.find({"date": today}, {"_id": 0}).to_list(1000)
    purchases_week = await db.purchases.find({"date": {"$gte": week_start}}, {"_id": 0}).to_list(1000)
    purchases_month = await db.purchases.find({"date": {"$gte": month_start}}, {"_id": 0}).to_list(1000)

    total_today = sum(p.get("total_price", 0) for p in purchases_today)
    total_week = sum(p.get("total_price", 0) for p in purchases_week)
    total_month = sum(p.get("total_price", 0) for p in purchases_month)

    wastes_month = await db.wastes.find({"date": {"$gte": month_start}}, {"_id": 0}).to_list(1000)
    total_waste = sum(w.get("estimated_cost", 0) for w in wastes_month)
    wastes_today = [w for w in wastes_month if w.get("date") == today]

    productions_today = await db.productions.find({"date": today}, {"_id": 0}).to_list(1000)
    productions_month = await db.productions.find({"date": {"$gte": month_start}}, {"_id": 0}).to_list(1000)

    raw_materials = await db.raw_materials.find({}, {"_id": 0}).to_list(1000)
    low_stock = [m for m in raw_materials if m.get("stock_min", 0) > 0 and m.get("stock", 0) <= m.get("stock_min", 0)]

    # Most purchased
    spending = {}
    for p in purchases_month:
        n = p.get("product_name", "")
        spending[n] = spending.get(n, 0) + p.get("total_price", 0)
    most_purchased = sorted(spending.items(), key=lambda x: x[1], reverse=True)[:5]

    # Most produced
    prod_count = {}
    for p in productions_month:
        n = p.get("product_name", "")
        prod_count[n] = prod_count.get(n, 0) + p.get("quantity", 0)
    most_produced = sorted(prod_count.items(), key=lambda x: x[1], reverse=True)[:5]

    # Price variations
    price_vars = []
    for mat in raw_materials:
        hist = await db.purchases.find(
            {"raw_material_id": mat["id"]}, {"_id": 0, "unit_price": 1}
        ).sort("created_at", -1).limit(2).to_list(2)
        if len(hist) >= 2:
            cur, prev = hist[0]["unit_price"], hist[1]["unit_price"]
            if prev > 0:
                pct = ((cur - prev) / prev) * 100
                if abs(pct) > 3:
                    price_vars.append({"product": mat["name"], "current": cur, "previous": prev, "pct": round(pct, 1)})

    # Waste by product
    waste_by = {}
    for w in wastes_month:
        n = w.get("product_name", "")
        waste_by[n] = waste_by.get(n, 0) + w.get("estimated_cost", 0)
    top_waste = sorted(waste_by.items(), key=lambda x: x[1], reverse=True)[:5]

    # Recommendations
    recs = []
    for n, c in top_waste:
        if c > 0:
            recs.append({"type": "merma", "message": f"{n} tiene merma alta (S/. {c:.2f} este mes). Revisar almacenamiento.", "severity": "warning"})
    for pv in price_vars:
        if pv["pct"] > 10:
            recs.append({"type": "precio", "message": f"{pv['product']} subio {pv['pct']}%. Buscar proveedor alternativo.", "severity": "info"})
    for item in low_stock:
        recs.append({"type": "stock", "message": f"{item['name']} tiene stock bajo ({item.get('stock', 0):.0f} {item.get('unit_base', '')}). Reabastecer.", "severity": "critical"})

    # Last 7 days purchases
    purchases_by_day = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        day_p = [p for p in purchases_month if p.get("date") == day] if day >= month_start else await db.purchases.find({"date": day}, {"_id": 0}).to_list(1000)
        purchases_by_day.append({"date": day, "total": round(sum(p.get("total_price", 0) for p in day_p), 2)})

    return {
        "purchases_today": round(total_today, 2),
        "purchases_week": round(total_week, 2),
        "purchases_month": round(total_month, 2),
        "wastes_today_count": len(wastes_today),
        "wastes_month_cost": round(total_waste, 2),
        "productions_today_count": len(productions_today),
        "low_stock_count": len(low_stock),
        "low_stock_items": [{k: v for k, v in m.items() if k != "_id"} for m in low_stock[:5]],
        "most_purchased": [{"name": n, "total": round(t, 2)} for n, t in most_purchased],
        "most_produced": [{"name": n, "total": t} for n, t in most_produced],
        "price_variations": price_vars[:5],
        "top_waste": [{"name": n, "cost": round(c, 2)} for n, c in top_waste],
        "recommendations": recs,
        "purchases_by_day": purchases_by_day
    }

# ==================== SETUP ====================

@api_router.get("/")
async def root():
    return {"message": "Polleria Management System API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
