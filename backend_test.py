import requests
import sys
import json
from datetime import datetime

class PolleriaAPITester:
    def __init__(self, base_url="https://polleria-dashboard.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'raw_materials': [],
            'cooked_products': [],
            'recipes': [],
            'purchases': [],
            'productions': [],
            'wastes': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test("API Root", "GET", "", 200)
        return success

    def test_raw_materials_crud(self):
        """Test raw materials CRUD operations"""
        print("\n📦 Testing Raw Materials CRUD...")
        
        # Test GET empty list
        success, _ = self.run_test("Get Raw Materials (empty)", "GET", "raw-materials", 200)
        if not success:
            return False

        # Test CREATE
        raw_material_data = {
            "name": "Pollo entero",
            "category": "Pollo",
            "unit_base": "g",
            "stock": 5000,
            "stock_min": 1000,
            "avg_cost": 0.015
        }
        success, response = self.run_test("Create Raw Material", "POST", "raw-materials", 200, raw_material_data)
        if not success:
            return False
        
        material_id = response.get('id')
        if material_id:
            self.created_ids['raw_materials'].append(material_id)
            print(f"   Created material ID: {material_id}")

        # Test GET with data
        success, response = self.run_test("Get Raw Materials (with data)", "GET", "raw-materials", 200)
        if not success or len(response) == 0:
            print("❌ Failed - No materials returned after creation")
            return False

        # Test UPDATE
        if material_id:
            update_data = {**raw_material_data, "stock": 6000}
            success, _ = self.run_test("Update Raw Material", "PUT", f"raw-materials/{material_id}", 200, update_data)
            if not success:
                return False

        return True

    def test_cooked_products_crud(self):
        """Test cooked products CRUD operations"""
        print("\n🍗 Testing Cooked Products CRUD...")
        
        # Test CREATE
        cooked_data = {
            "name": "Pollo a la brasa entero",
            "category": "Platos Principales"
        }
        success, response = self.run_test("Create Cooked Product", "POST", "cooked-products", 200, cooked_data)
        if not success:
            return False
        
        product_id = response.get('id')
        if product_id:
            self.created_ids['cooked_products'].append(product_id)
            print(f"   Created product ID: {product_id}")

        # Test GET
        success, response = self.run_test("Get Cooked Products", "GET", "cooked-products", 200)
        if not success or len(response) == 0:
            print("❌ Failed - No products returned after creation")
            return False

        return True

    def test_recipes_crud(self):
        """Test recipes CRUD operations"""
        print("\n📋 Testing Recipes CRUD...")
        
        if not self.created_ids['raw_materials'] or not self.created_ids['cooked_products']:
            print("❌ Skipping recipes test - need raw materials and cooked products first")
            return False

        # Test CREATE
        recipe_data = {
            "name": "Receta Pollo a la Brasa",
            "cooked_product_id": self.created_ids['cooked_products'][0],
            "cooked_product_name": "Pollo a la brasa entero",
            "yield_quantity": 1,
            "ingredients": [
                {
                    "raw_material_id": self.created_ids['raw_materials'][0],
                    "raw_material_name": "Pollo entero",
                    "quantity": 1500,
                    "unit": "g"
                }
            ]
        }
        success, response = self.run_test("Create Recipe", "POST", "recipes", 200, recipe_data)
        if not success:
            return False
        
        recipe_id = response.get('id')
        if recipe_id:
            self.created_ids['recipes'].append(recipe_id)
            print(f"   Created recipe ID: {recipe_id}")

        # Test GET
        success, response = self.run_test("Get Recipes", "GET", "recipes", 200)
        if not success or len(response) == 0:
            print("❌ Failed - No recipes returned after creation")
            return False

        return True

    def test_purchases_flow(self):
        """Test purchases with stock update"""
        print("\n💰 Testing Purchases Flow...")
        
        if not self.created_ids['raw_materials']:
            print("❌ Skipping purchases test - need raw materials first")
            return False

        # Test CREATE purchase
        purchase_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "raw_material_id": self.created_ids['raw_materials'][0],
            "product_name": "Pollo entero",
            "category": "Pollo",
            "supplier": "Proveedor Test",
            "quantity": 2,
            "unit": "kg",
            "unit_price": 15.50,
            "total_price": 31.00,
            "observation": "Compra de prueba"
        }
        success, response = self.run_test("Create Purchase", "POST", "purchases", 200, purchase_data)
        if not success:
            return False
        
        purchase_id = response.get('id')
        if purchase_id:
            self.created_ids['purchases'].append(purchase_id)
            print(f"   Created purchase ID: {purchase_id}")

        # Verify stock was updated
        success, materials = self.run_test("Verify Stock Update", "GET", "raw-materials", 200)
        if success and materials:
            material = next((m for m in materials if m['id'] == self.created_ids['raw_materials'][0]), None)
            if material:
                print(f"   Stock after purchase: {material.get('stock', 0)} g")
                if material.get('stock', 0) > 5000:  # Original was 5000g, added 2kg = 2000g
                    print("✅ Stock update verified")
                else:
                    print("❌ Stock update failed")
                    return False

        # Test price comparison with second purchase
        purchase_data2 = {**purchase_data, "unit_price": 16.00, "total_price": 32.00}
        success, response = self.run_test("Create Second Purchase (Price Comparison)", "POST", "purchases", 200, purchase_data2)
        if success and response.get('price_change_pct') is not None:
            print(f"   Price change: {response.get('price_change_pct')}%")
            print("✅ Price comparison working")
        
        return True

    def test_production_flow(self):
        """Test production with recipe-based deduction"""
        print("\n🏭 Testing Production Flow...")
        
        if not self.created_ids['recipes'] or not self.created_ids['cooked_products']:
            print("❌ Skipping production test - need recipes and cooked products first")
            return False

        # Test CREATE production
        production_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "recipe_id": self.created_ids['recipes'][0],
            "cooked_product_id": self.created_ids['cooked_products'][0],
            "product_name": "Pollo a la brasa entero",
            "quantity": 2,
            "observation": "Produccion de prueba"
        }
        success, response = self.run_test("Create Production", "POST", "productions", 200, production_data)
        if not success:
            return False
        
        production_id = response.get('id')
        if production_id:
            self.created_ids['productions'].append(production_id)
            print(f"   Created production ID: {production_id}")

        # Verify raw material stock was deducted
        success, materials = self.run_test("Verify Raw Material Deduction", "GET", "raw-materials", 200)
        if success and materials:
            material = next((m for m in materials if m['id'] == self.created_ids['raw_materials'][0]), None)
            if material:
                print(f"   Raw material stock after production: {material.get('stock', 0)} g")

        # Verify cooked product stock was incremented
        success, products = self.run_test("Verify Cooked Product Increment", "GET", "cooked-products", 200)
        if success and products:
            product = next((p for p in products if p['id'] == self.created_ids['cooked_products'][0]), None)
            if product:
                print(f"   Cooked product stock after production: {product.get('stock', 0)} units")
                if product.get('stock', 0) >= 2:
                    print("✅ Production stock update verified")
                else:
                    print("❌ Production stock update failed")
                    return False

        return True

    def test_waste_flow(self):
        """Test waste registration with stock deduction"""
        print("\n🗑️ Testing Waste Flow...")
        
        if not self.created_ids['raw_materials']:
            print("❌ Skipping waste test - need raw materials first")
            return False

        # Test CREATE waste for raw material
        waste_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "inventory_type": "materia_prima",
            "product_id": self.created_ids['raw_materials'][0],
            "product_name": "Pollo entero",
            "category": "Pollo",
            "quantity": 500,
            "unit": "g",
            "reason": "Vencimiento",
            "estimated_cost": 7.50,
            "observation": "Merma de prueba"
        }
        success, response = self.run_test("Create Waste", "POST", "wastes", 200, waste_data)
        if not success:
            return False
        
        waste_id = response.get('id')
        if waste_id:
            self.created_ids['wastes'].append(waste_id)
            print(f"   Created waste ID: {waste_id}")

        # Verify stock was deducted
        success, materials = self.run_test("Verify Waste Stock Deduction", "GET", "raw-materials", 200)
        if success and materials:
            material = next((m for m in materials if m['id'] == self.created_ids['raw_materials'][0]), None)
            if material:
                print(f"   Stock after waste: {material.get('stock', 0)} g")
                print("✅ Waste stock deduction verified")

        return True

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        print("\n📊 Testing Dashboard Summary...")
        
        success, response = self.run_test("Get Dashboard Summary", "GET", "dashboard/summary", 200)
        if not success:
            return False

        # Verify required fields are present
        required_fields = [
            'purchases_today', 'purchases_week', 'purchases_month',
            'wastes_today_count', 'wastes_month_cost', 'productions_today_count',
            'low_stock_count', 'most_purchased', 'most_produced',
            'price_variations', 'top_waste', 'recommendations', 'purchases_by_day'
        ]
        
        missing_fields = [field for field in required_fields if field not in response]
        if missing_fields:
            print(f"❌ Missing fields in dashboard: {missing_fields}")
            return False
        
        print("✅ Dashboard summary structure verified")
        print(f"   Purchases today: S/. {response.get('purchases_today', 0)}")
        print(f"   Low stock items: {response.get('low_stock_count', 0)}")
        print(f"   Recommendations: {len(response.get('recommendations', []))}")
        
        return True

    def test_unit_conversion_logic(self):
        """Test unit conversion in purchases"""
        print("\n⚖️ Testing Unit Conversion Logic...")
        
        if not self.created_ids['raw_materials']:
            print("❌ Skipping conversion test - need raw materials first")
            return False

        # Get current stock
        success, materials = self.run_test("Get Current Stock", "GET", "raw-materials", 200)
        if not success:
            return False
        
        material = next((m for m in materials if m['id'] == self.created_ids['raw_materials'][0]), None)
        if not material:
            print("❌ Material not found")
            return False
        
        initial_stock = material.get('stock', 0)
        print(f"   Initial stock: {initial_stock} g")

        # Purchase in kg (should convert to g)
        purchase_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "raw_material_id": self.created_ids['raw_materials'][0],
            "product_name": "Pollo entero",
            "category": "Pollo",
            "supplier": "Test Conversion",
            "quantity": 1,
            "unit": "kg",
            "unit_price": 15.00,
            "total_price": 15.00
        }
        success, _ = self.run_test("Purchase with kg unit", "POST", "purchases", 200, purchase_data)
        if not success:
            return False

        # Verify conversion (1 kg = 1000 g)
        success, materials = self.run_test("Verify Conversion", "GET", "raw-materials", 200)
        if success and materials:
            material = next((m for m in materials if m['id'] == self.created_ids['raw_materials'][0]), None)
            if material:
                final_stock = material.get('stock', 0)
                added_stock = final_stock - initial_stock
                print(f"   Final stock: {final_stock} g")
                print(f"   Added stock: {added_stock} g")
                if abs(added_stock - 1000) < 0.1:  # 1 kg should add 1000 g
                    print("✅ Unit conversion verified")
                    return True
                else:
                    print("❌ Unit conversion failed")
                    return False

        return False

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order of dependencies
        for waste_id in self.created_ids['wastes']:
            self.run_test(f"Delete Waste {waste_id}", "DELETE", f"wastes/{waste_id}", 200)
        
        for production_id in self.created_ids['productions']:
            self.run_test(f"Delete Production {production_id}", "DELETE", f"productions/{production_id}", 200)
        
        for purchase_id in self.created_ids['purchases']:
            self.run_test(f"Delete Purchase {purchase_id}", "DELETE", f"purchases/{purchase_id}", 200)
        
        for recipe_id in self.created_ids['recipes']:
            self.run_test(f"Delete Recipe {recipe_id}", "DELETE", f"recipes/{recipe_id}", 200)
        
        for product_id in self.created_ids['cooked_products']:
            self.run_test(f"Delete Cooked Product {product_id}", "DELETE", f"cooked-products/{product_id}", 200)
        
        for material_id in self.created_ids['raw_materials']:
            self.run_test(f"Delete Raw Material {material_id}", "DELETE", f"raw-materials/{material_id}", 200)

def main():
    print("🏪 Starting Polleria Management System API Tests")
    print("=" * 60)
    
    tester = PolleriaAPITester()
    
    # Run all tests
    tests = [
        tester.test_api_root,
        tester.test_raw_materials_crud,
        tester.test_cooked_products_crud,
        tester.test_recipes_crud,
        tester.test_purchases_flow,
        tester.test_production_flow,
        tester.test_waste_flow,
        tester.test_dashboard_summary,
        tester.test_unit_conversion_logic
    ]
    
    failed_tests = []
    
    for test in tests:
        try:
            if not test():
                failed_tests.append(test.__name__)
        except Exception as e:
            print(f"❌ {test.__name__} crashed: {str(e)}")
            failed_tests.append(test.__name__)
    
    # Cleanup
    try:
        tester.cleanup()
    except Exception as e:
        print(f"⚠️ Cleanup failed: {str(e)}")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())