import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/Sidebar";
import HomePage from "@/pages/HomePage";
import PurchasesPage from "@/pages/PurchasesPage";
import ProductionPage from "@/pages/ProductionPage";
import WastePage from "@/pages/WastePage";
import RawInventoryPage from "@/pages/RawInventoryPage";
import CookedInventoryPage from "@/pages/CookedInventoryPage";
import DashboardPage from "@/pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="page-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compras" element={<PurchasesPage />} />
            <Route path="/produccion" element={<ProductionPage />} />
            <Route path="/mermas" element={<WastePage />} />
            <Route path="/materia-prima" element={<RawInventoryPage />} />
            <Route path="/productos-cocidos" element={<CookedInventoryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
