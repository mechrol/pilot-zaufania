"use client";

import { useState } from "react";
import PassengerForm from "@/components/PassengerForm";
import DriverForm from "@/components/DriverForm";
import CarForm from "@/components/CarForm";
import RouteForm from "@/components/RouteForm";
import { User, Car, MapPin, ShieldCheck, Menu, X } from "lucide-react";
import type { PassengerInput, DriverInput, CarInput, RouteInput } from "@/lib/validations";

type Tab = "passenger" | "driver" | "car" | "route";

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "passenger", label: "Pasażer", icon: <User className="w-5 h-5" />, color: "blue" },
  { id: "driver", label: "Kierowca", icon: <ShieldCheck className="w-5 h-5" />, color: "green" },
  { id: "car", label: "Samochód", icon: <Car className="w-5 h-5" />, color: "purple" },
  { id: "route", label: "Trasa", icon: <MapPin className="w-5 h-5" />, color: "orange" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("passenger");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePassengerSubmit = async (data: PassengerInput) => {
    const res = await fetch("/api/passengers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json(); showToast(err.errors ? Object.values(err.errors).flat().join(", ") : "Błąd zapisu", "error"); }
    else showToast("Pasażer zapisany pomyślnie!");
  };

  const handleDriverSubmit = async (data: DriverInput) => {
    const res = await fetch("/api/drivers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json(); showToast(err.errors ? Object.values(err.errors).flat().join(", ") : "Błąd zapisu", "error"); }
    else showToast("Kierowca zapisany pomyślnie!");
  };

  const handleCarSubmit = async (data: CarInput) => {
    const res = await fetch("/api/cars", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json(); showToast(err.errors ? Object.values(err.errors).flat().join(", ") : "Błąd zapisu", "error"); }
    else showToast("Samochód zapisany pomyślnie!");
  };

  const handleRouteSubmit = async (data: RouteInput) => {
    const res = await fetch("/api/routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json(); showToast(err.errors ? Object.values(err.errors).flat().join(", ") : "Błąd zapisu", "error"); }
    else showToast("Trasa zapisana pomyślnie!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg">PZ</div>
            <div><h1 className="font-bold text-lg leading-tight">Pilot Zaufania</h1><p className="text-xs text-gray-500">System profili transportowych</p></div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <nav className="hidden md:flex gap-1 mb-8 bg-white rounded-xl p-1 shadow-sm border">
          {TABS.map(({ id, label, icon, color }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === id ? `bg-${color}-600 text-white shadow-md` : "text-gray-600 hover:bg-gray-100"}`}>{icon} {label}</button>
          ))}
        </nav>

        {mobileMenuOpen && (
          <nav className="md:hidden mb-6 bg-white rounded-xl shadow-sm border divide-y">
            {TABS.map(({ id, label, icon }) => (<button key={id} onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 py-3 px-4 font-medium transition ${activeTab === id ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}>{icon} {label}</button>))}
          </nav>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          {activeTab === "passenger" && <PassengerForm onSubmit={handlePassengerSubmit} />}
          {activeTab === "driver" && <DriverForm onSubmit={handleDriverSubmit} />}
          {activeTab === "car" && <CarForm driverId="" onSubmit={handleCarSubmit} />}
          {activeTab === "route" && <RouteForm onSubmit={handleRouteSubmit} />}
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 flex">
          {TABS.map(({ id, label, icon, color }) => (<button key={id} onClick={() => setActiveTab(id)} className={`flex-1 flex flex-col items-center justify-center py-2 text-xs gap-1 transition ${activeTab === id ? `text-${color}-600` : "text-gray-400"}`}>{icon}<span className="font-medium">{label}</span></button>))}
        </nav>
      </div>

      {toast && (<div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{toast.message}</div>)}
    </div>
  );
}
