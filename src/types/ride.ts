export type RideStatus = "booked" | "in_progress" | "completed" | "pending_approval" | "approved" | "disputed";
export type RideTier = "T1" | "T2" | "T3";
export type RideCategoryKey = string;
export interface Ride { rideId:string; passengerId:string; driverId?:string; categoryKey?:RideCategoryKey; pickup:string; dropoff:string; status:RideStatus; tier:RideTier; createdAt:string; startedAt?:string; completedAt?:string; fareBase?:number; fareDistanceKm?:number; farePerKm?:number; fareTotal?:number; fareFinal?:number; }
export interface CreateRideInput { passengerId:string; driverId?:string; categoryKey?:string; pickup:string; dropoff:string; tier?:RideTier; }
export interface UpdateRideInput { status?:RideStatus; driverId?:string; startedAt?:string; completedAt?:string; fareBase?:number; fareDistanceKm?:number; farePerKm?:number; fareTotal?:number; fareFinal?:number; }
