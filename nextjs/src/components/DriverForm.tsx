"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverSchema, type DriverInput } from "@/lib/validations";
import { User, Mail, Phone, MapPin, Car, FileText, ShieldCheck } from "lucide-react";

interface Props {
  onSubmit: (data: DriverInput) => Promise<void>;
  defaultValues?: Partial<DriverInput>;
}

export default function DriverForm({ onSubmit, defaultValues }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DriverInput>({
    resolver: zodResolver(driverSchema),
    defaultValues: { country: "Polska", rating: 5.0, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Car className="w-6 h-6" /> Profil Kierowcy</h2>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2">Dane podstawowe</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Imię *</label><input {...register("firstName")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">Nazwisko *</label><input {...register("lastName")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Mail className="w-4 h-4" /> Email *</label><input {...register("email")} type="email" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Phone className="w-4 h-4" /> Telefon</label><input {...register("phone")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Data urodzenia</label><input {...register("dateOfBirth")} type="date" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Prawo jazdy</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Numer prawa jazdy *</label><input {...register("licenseNumber")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">Data ważności</label><input {...register("licenseExpiry")} type="date" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Kategorie (np. B, C, D)</label><input {...register("licenseCategories")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Adres</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Ulica</label><input {...register("street")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Miasto</label><input {...register("city")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Kod pocztowy</label><input {...register("postCode")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Kraj</label><input {...register("country")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2">Status i doświadczenie</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium mb-1">Lata doświadczenia</label><input {...register("yearsOfExperience",{valueAsNumber:true})} type="number" min={0} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select {...register("status")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value="">— wybierz —</option><option value="aktywny">Aktywny</option><option value="nieaktywny">Nieaktywny</option><option value="zawieszony">Zawieszony</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Ocena</label><input {...register("rating",{valueAsNumber:true})} type="number" step={0.1} min={0} max={5} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>
      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><FileText className="w-4 h-4" /> Notatki</legend>
        <textarea {...register("notes")} rows={3} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
      </fieldset>
      <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition">{isSubmitting ? "Zapisywanie..." : "Zapisz kierowcę"}</button>
    </form>
  );
}
