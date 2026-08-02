var fs=require("fs"),p=require("path");
var base=__dirname;
function w(rel,content){
  var fp=p.join(base,rel);
  var d=p.dirname(fp);
  if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(fp,content,"utf8");
  console.log("OK "+rel);
}

// ── 1. src/lib/supabase.ts ──
w("src/lib/supabase.ts",
"// Supabase client\n"+
"const SUPABASE_URL = \"https://your-project.supabase.co\";\n"+
"const SUPABASE_ANON_KEY = \"your-anon-key\";\n"+
"let _c = null;\n"+
"async function gc() { if(_c) return _c; try { const {createClient} = await import(\"@supabase/supabase-js\"); _c=createClient(SUPABASE_URL,SUPABASE_ANON_KEY); return _c; } catch { return null; } }\n"+
"export async function isSupabaseAvailable() { return (await gc()) !== null; }\n"+
"export async function getSupabaseClient() { return gc(); }\n"+
"export { SUPABASE_URL, SUPABASE_ANON_KEY };\n"
);

console.log("all done");

// ── 2. src/types/ride.ts ──
w("src/types/ride.ts","export type RideStatus = \"booked\" | \"in_progress\" | \"completed\" | \"pending_approval\" | \"approved\" | \"disputed\";\n"+
"export type RideTier = \"T1\" | \"T2\" | \"T3\";\n"+
"export type RideCategoryKey = string;\n"+
"export interface Ride { rideId:string; passengerId:string; driverId?:string; categoryKey?:RideCategoryKey; pickup:string; dropoff:string; status:RideStatus; tier:RideTier; createdAt:string; startedAt?:string; completedAt?:string; fareBase?:number; fareDistanceKm?:number; farePerKm?:number; fareTotal?:number; fareFinal?:number; }\n"+
"export interface CreateRideInput { passengerId:string; driverId?:string; categoryKey?:string; pickup:string; dropoff:string; tier?:RideTier; }\n"+
"export interface UpdateRideInput { status?:RideStatus; driverId?:string; startedAt?:string; completedAt?:string; fareBase?:number; fareDistanceKm?:number; farePerKm?:number; fareTotal?:number; fareFinal?:number; }\n");

// ── 3. src/types/journal.ts ──
w("src/types/journal.ts","export type JournalAuthorRole = \"passenger\" | \"driver\";\n"+
"export type JournalVisibility = \"private\" | \"shared\" | \"public\";\n"+
"export interface JournalEntry { entryId:string; rideId?:string; authorId:string; authorRole:JournalAuthorRole; promptId?:string; content:string; visibility:JournalVisibility; createdAt:string; }\n"+
"export interface ReflectionPrompt { id:string; text:string; category:string; createdAt:string; }\n"+
"export interface CreateJournalEntryInput { rideId?:string; authorId:string; authorRole:JournalAuthorRole; promptId?:string; content:string; visibility?:JournalVisibility; }\n"+
"export interface UpdateJournalEntryInput { content?:string; visibility?:JournalVisibility; }\n");

// ── 4. src/types/contract.ts ──
w("src/types/contract.ts","export type ContractStatus = \"draft\" | \"pending_approval\" | \"disputed\" | \"approved\" | \"approved_with_correction\" | \"rejected\";\n"+
"export interface Signoff { userId:string; role:\"passenger\"|\"driver\"; signedAt:string; signatureRef:string; corrections?:Record<string,unknown>; }\n"+
"export interface CostBreakdown { baseFare:number; distanceKm:number; perKmRate:number; distanceCost:number; surcharges:Record<string,number>; discounts:Record<string,number>; total:number; }\n"+
"export interface Contract { contractId:string; rideId:string; passengerSnapshot:Record<string,unknown>; driverSnapshot:Record<string,unknown>; vehicleSnapshot:Record<string,unknown>; costBreakdown:CostBreakdown; status:ContractStatus; passengerSignoff?:Signoff; driverSignoff?:Signoff; createdAt:string; }\n"+
"export interface CreateContractInput { rideId:string; passengerSnapshot?:Record<string,unknown>; driverSnapshot?:Record<string,unknown>; vehicleSnapshot?:Record<string,unknown>; costBreakdown:CostBreakdown; }\n"+
"export interface UpdateContractInput { status?:ContractStatus; passengerSignoff?:Signoff; driverSignoff?:Signoff; costBreakdown?:Partial<CostBreakdown>; }\n");

// ── 5. src/types/ride-event.ts ──
w("src/types/ride-event.ts","export type RideEventType = \"trip_start\" | \"route_update\" | \"stop\" | \"trip_end\" | \"manual_alert\";\n"+
"export type RideEventSourceTier = \"T1\" | \"T2\" | \"T3\";\n"+
"export interface RideEvent { eventId:string; rideId:string; sourceTier:RideEventSourceTier; eventType:RideEventType; payload:Record<string,unknown>; geolocation?:{latitude:number;longitude:number}; evidenceRef?:string; integrityHash:string; timestamp:string; }\n"+
"export interface CreateRideEventInput { rideId:string; sourceTier?:RideEventSourceTier; eventType:RideEventType; payload?:Record<string,unknown>; geolocation?:{latitude:number;longitude:number}; evidenceRef?:string; }\n");

// ── 6. src/schemas/ride.ts ──
w("src/schemas/ride.ts","import { z } from \"zod\";\n"+
"export const rideStatusSchema = z.enum([\"booked\",\"in_progress\",\"completed\",\"pending_approval\",\"approved\",\"disputed\"]);\n"+
"export const rideTierSchema = z.enum([\"T1\",\"T2\",\"T3\"]);\n"+
"export const rideSchema = z.object({ rideId:z.string().uuid(), passengerId:z.string().uuid(), driverId:z.string().uuid().optional(), categoryKey:z.string().optional(), pickup:z.string().min(1), dropoff:z.string().min(1), status:rideStatusSchema.default(\"booked\"), tier:rideTierSchema.default(\"T1\"), createdAt:z.string().datetime(), startedAt:z.string().datetime().optional(), completedAt:z.string().datetime().optional(), fareBase:z.number().min(0).optional(), fareDistanceKm:z.number().min(0).optional(), farePerKm:z.number().min(0).optional(), fareTotal:z.number().min(0).optional(), fareFinal:z.number().min(0).optional() });\n"+
"export const createRideInputSchema = rideSchema.omit({ rideId:true, createdAt:true, status:true, startedAt:true, completedAt:true, fareBase:true, fareDistanceKm:true, farePerKm:true, fareTotal:true, fareFinal:true }).extend({ tier:rideTierSchema.optional() });\n"+
"export const updateRideInputSchema = z.object({ status:rideStatusSchema.optional(), driverId:z.string().uuid().optional(), startedAt:z.string().datetime().optional(), completedAt:z.string().datetime().optional(), fareBase:z.number().min(0).optional(), fareDistanceKm:z.number().min(0).optional(), farePerKm:z.number().min(0).optional(), fareTotal:z.number().min(0).optional(), fareFinal:z.number().min(0).optional() });\n"+
"export type CreateRideInput = z.infer<typeof createRideInputSchema>;\n"+
"export type UpdateRideInput = z.infer<typeof updateRideInputSchema>;\n");