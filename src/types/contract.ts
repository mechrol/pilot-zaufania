export type ContractStatus = "draft" | "pending_approval" | "disputed" | "approved" | "approved_with_correction" | "rejected";
export interface Signoff { userId:string; role:"passenger"|"driver"; signedAt:string; signatureRef:string; corrections?:Record<string,unknown>; }
export interface CostBreakdown { baseFare:number; distanceKm:number; perKmRate:number; distanceCost:number; surcharges:Record<string,number>; discounts:Record<string,number>; total:number; }
export interface Contract { contractId:string; rideId:string; passengerSnapshot:Record<string,unknown>; driverSnapshot:Record<string,unknown>; vehicleSnapshot:Record<string,unknown>; costBreakdown:CostBreakdown; status:ContractStatus; passengerSignoff?:Signoff; driverSignoff?:Signoff; createdAt:string; }
export interface CreateContractInput { rideId:string; passengerSnapshot?:Record<string,unknown>; driverSnapshot?:Record<string,unknown>; vehicleSnapshot?:Record<string,unknown>; costBreakdown:CostBreakdown; }
export interface UpdateContractInput { status?:ContractStatus; passengerSignoff?:Signoff; driverSignoff?:Signoff; costBreakdown?:Partial<CostBreakdown>; }
