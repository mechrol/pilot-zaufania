export type RideEventType = "trip_start" | "route_update" | "stop" | "trip_end" | "manual_alert";
export type RideEventSourceTier = "T1" | "T2" | "T3";
export interface RideEvent { eventId:string; rideId:string; sourceTier:RideEventSourceTier; eventType:RideEventType; payload:Record<string,unknown>; geolocation?:{latitude:number;longitude:number}; evidenceRef?:string; integrityHash:string; timestamp:string; }
export interface CreateRideEventInput { rideId:string; sourceTier?:RideEventSourceTier; eventType:RideEventType; payload?:Record<string,unknown>; geolocation?:{latitude:number;longitude:number}; evidenceRef?:string; }
