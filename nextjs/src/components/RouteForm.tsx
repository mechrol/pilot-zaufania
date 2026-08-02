"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { routeSchema, type RouteInput } from "@/lib/validations";
import { MapPin, Plus, Trash2, Clock, GripVertical, Flag } from "lucide-react";

const EVENT_LABELS: Record<string,string> = {
  "początek_załadunku":"Początek załadunku","koniec_załadunku":"Koniec załadunku",
  "początek_rozładunku":"Początek rozładunku","koniec_rozładunku":"Koniec rozładunku",
  "odpoczynek":"Odpoczynek","tankowanie":"Tankowanie","kontrola":"Kontrola",
  "przekroczenie_granicy":"Przekroczenie granicy","awaria":"Awaria","inne":"Inne",
};

interface Props {
  passengerId?: string; driverId?: string; carId?: string;
  onSubmit: (data: RouteInput) => Promise<void>;
  defaultValues?: Partial<RouteInput>;
}

export default function RouteForm({ passengerId, driverId, carId, onSubmit, defaultValues }: Props) {
  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RouteInput>({
    resolver: zodResolver(routeSchema),
    defaultValues: { status:"zaplanowana", passengerId, driverId, carId, waypoints:[], ...defaultValues },
  });
  const { fields, append, remove, move } = useFieldArray({ control, name:"waypoints" });
  const waypoints = watch("waypoints");
  const addWaypoint = () => append({ order: fields.length+1, name:"", address:"", eventStatus:"oczekujące" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6" /> Trasa przejazdu</h2>

      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2">Informacje o trasie</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Nazwa trasy *</label><input {...register("name")} placeholder="np. Warszawa → Kraków" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select {...register("status")} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value="zaplanowana">Zaplanowana</option><option value="w_trakcie">W trakcie</option><option value="zakończona">Zakończona</option><option value="anulowana">Anulowana</option></select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Opis</label><textarea {...register("description")} rows={2} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>

      <fieldset className="border rounded-xl p-4 space-y-4 bg-gradient-to-r from-green-50 to-red-50">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><Flag className="w-4 h-4" /> Punkty trasy A → B</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border-2 border-green-300"><h4 className="font-bold text-green-700 mb-2">🟢 Punkt A — Początek</h4>
            <div className="space-y-2">
              <div><label className="block text-sm font-medium mb-1">Adres / miejsce *</label><input {...register("startPoint")} placeholder="np. Warszawa, ul. Marszałkowska 1" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />{errors.startPoint && <p className="text-red-500 text-sm mt-1">{errors.startPoint.message}</p>}</div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-medium mb-1">Szer. geogr.</label><input {...register("startLat",{valueAsNumber:true})} type="number" step="any" placeholder="52.2297" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" /></div><div><label className="block text-xs font-medium mb-1">Dł. geogr.</label><input {...register("startLng",{valueAsNumber:true})} type="number" step="any" placeholder="21.0122" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" /></div></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-red-300"><h4 className="font-bold text-red-700 mb-2">🔴 Punkt B — Koniec</h4>
            <div className="space-y-2">
              <div><label className="block text-sm font-medium mb-1">Adres / miejsce *</label><input {...register("endPoint")} placeholder="np. Kraków, Rynek Główny 1" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none" />{errors.endPoint && <p className="text-red-500 text-sm mt-1">{errors.endPoint.message}</p>}</div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-medium mb-1">Szer. geogr.</label><input {...register("endLat",{valueAsNumber:true})} type="number" step="any" placeholder="50.0647" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div><div><label className="block text-xs font-medium mb-1">Dł. geogr.</label><input {...register("endLng",{valueAsNumber:true})} type="number" step="any" placeholder="19.9450" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none" /></div></div>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><Clock className="w-4 h-4" /> Parametry</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium mb-1">Dystans (km)</label><input {...register("distanceKm",{valueAsNumber:true})} type="number" min={0} step={0.1} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Szac. czas (min)</label><input {...register("estimatedTimeMin",{valueAsNumber:true})} type="number" min={0} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Planowana data</label><input {...register("scheduledAt")} type="datetime-local" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </fieldset>

      <fieldset className="border rounded-xl p-4 space-y-4">
        <legend className="text-lg font-semibold px-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Punkty przejściowe i zdarzenia ({fields.length})</legend>
        {fields.length === 0 && (<div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl"><MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Brak punktów przejściowych</p><p className="text-sm">Dodaj punkty pośrednie, aby rejestrować zdarzenia na trasie</p></div>)}
        <div className="space-y-3">
          {fields.map((field, index) => (<div key={field.id} className="border rounded-xl p-4 bg-white relative group">
            <div className="flex items-center gap-3 mb-3"><button type="button" onClick={() => move(index, index-1)} disabled={index===0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><GripVertical className="w-5 h-5" /></button><span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">Punkt {index+1}</span><button type="button" onClick={() => remove(index)} className="ml-auto text-red-400 hover:text-red-600 transition"><Trash2 className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="hidden" {...register(`waypoints.${index}.order`)} value={index+1} />
              <div><label className="block text-xs font-medium mb-1">Nazwa punktu *</label><input {...register(`waypoints.${index}.name`)} placeholder="np. Punkt załadunku" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-xs font-medium mb-1">Adres *</label><input {...register(`waypoints.${index}.address`)} placeholder="Adres punktu" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-xs font-medium mb-1">Szer. geogr.</label><input {...register(`waypoints.${index}.latitude`,{valueAsNumber:true})} type="number" step="any" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-xs font-medium mb-1">Dł. geogr.</label><input {...register(`waypoints.${index}.longitude`,{valueAsNumber:true})} type="number" step="any" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium mb-1">Typ zdarzenia</label><select {...register(`waypoints.${index}.eventType`)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">— brak zdarzenia —</option>{Object.entries(EVENT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div><label className="block text-xs font-medium mb-1">Planowany przyjazd</label><input {...register(`waypoints.${index}.estimatedArrival`)} type="datetime-local" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-xs font-medium mb-1">Notatki</label><input {...register(`waypoints.${index}.notes`)} placeholder="Dodatkowe informacje" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
            {waypoints?.[index]?.eventType && <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full"><Flag className="w-3 h-3" />Zdarzenie: {EVENT_LABELS[waypoints[index].eventType!] || waypoints[index].eventType} <span className="text-amber-500">(do rejestracji)</span></div>}
          </div>))}
        </div>
        <button type="button" onClick={addWaypoint} className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Dodaj punkt przejściowy</button>
      </fieldset>

      <input type="hidden" {...register("passengerId")} /><input type="hidden" {...register("driverId")} /><input type="hidden" {...register("carId")} />
      <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition">{isSubmitting ? "Zapisywanie..." : "Zapisz trasę"}</button>
    </form>
  );
}
