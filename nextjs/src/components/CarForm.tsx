"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { carSchema, type CarInput } from "@/lib/validations";
import { Car, FileText, ShieldCheck, Wrench } from "lucide-react";

interface Props {
  driverId: string;
  onSubmit: (data: CarInput) => Promise<void>;
  defaultValues?: Partial<CarInput>;
}

export default function CarForm({ driverId, onSubmit, defaultValues }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CarInput>({
    resolver: zodResolver(carSchema),
    defaultValues: { seats: 5, doors: 5, isActive: true, driverId, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Car className="w-6 h-6" /> Profil Samochodu</h2>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2">Dane podstawowe</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Marka *</label><input {...register("brand")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">Model *</label><input {...register("model")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">Rok produkcji</label><input {...register("year",{valueAsNumber:true})} type="number" min={1900} max={2030} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Numer rejestracyjny *</label><input {...register("registrationPlate")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase" />{errors.registrationPlate && <p className="text-red-500 text-sm mt-1">{errors.registrationPlate.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">VIN</label><input {...register("vin")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase" /></div>
          <div><label className="block text-sm font-medium mb-1">Kolor</label><input {...register("color")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><Wrench className="w-4 h-4" /> Dane techniczne</legend>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium mb-1">Paliwo</label><select {...register("fuelType")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value="">— wybierz —</option><option value="benzyna">Benzyna</option><option value="diesel">Diesel</option><option value="lpg">LPG</option><option value="elektryczny">Elektryczny</option><option value="hybryda">Hybryda</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Poj. silnika (cm³)</label><input {...register("engineCapacity",{valueAsNumber:true})} type="number" min={0} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Moc (kW)</label><input {...register("powerKw",{valueAsNumber:true})} type="number" min={0} step={0.1} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Przebieg (km)</label><input {...register("mileage",{valueAsNumber:true})} type="number" min={0} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Miejsca</label><input {...register("seats",{valueAsNumber:true})} type="number" min={1} max={50} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Drzwi</label><input {...register("doors",{valueAsNumber:true})} type="number" min={2} max={6} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Ubezpieczenie i przegląd</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Ubezpieczyciel</label><input {...register("insuranceProvider")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Nr polisy</label><input {...register("insuranceNumber")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Ważność OC</label><input {...register("insuranceExpiry")} type="date" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Przegląd techniczny</label><input {...register("technicalInspection")} type="date" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input {...register("isActive")} type="checkbox" className="w-4 h-4 rounded" /><span className="text-sm">Pojazd aktywny</span></label>
      </fieldset>
      <input type="hidden" {...register("driverId")} />
      <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition">{isSubmitting ? "Zapisywanie..." : "Zapisz samochód"}</button>
    </form>
  );
}
