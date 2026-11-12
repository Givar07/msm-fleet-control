export type Role = "super_admin" | "admin_area" | "user" | "management";
export type AreaId = 1 | 2 | 3;
export type UnitType = "HT" | "DT";
export type UnitStatus = "Operational" | "Standby" | "Breakdown";
export type ReqStatus = "Pending" | "Under Review" | "Approved" | "Partially Approved" | "Rejected" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
export type AttStatus = "Hadir" | "Izin" | "Sakit" | "Cuti" | "Alpha";
export interface Unit { id: string; type: UnitType; area: AreaId; location: string; status: UnitStatus; shift: string; driverNik?: string; updatedAt: string; note: string }
export interface Driver { nik: string; name: string; area: AreaId; active: boolean; phone?: string }
export interface Attendance { id: string; date: string; nik: string; shift: string; status: AttStatus; in?: string; out?: string; note: string }
export interface TruckRequest { id: string; requester: string; department?: string; phone?: string; area: AreaId; type: UnitType; qty: number; date: string; start: string; end: string; destination: string; activity: string; note: string; status: ReqStatus; approved: number; assigned: number; rejectReason?: string; createdAt: string }
export interface Schedule { id: string; date: string; unitId: string; driverNik: string; area: AreaId; destination: string; activity: string; start: string; end: string; status: string; requestId?: string; department?: string; userName?: string; userPhone?: string }
export interface StatusHistory { id: string; unitId: string; from: UnitStatus; to: UnitStatus; note: string; at: string }
export interface DB { units: Unit[]; drivers: Driver[]; attendance: Attendance[]; requests: TruckRequest[]; schedules: Schedule[]; history: StatusHistory[] }
export const AREAS: Record<AreaId, string> = { 1: "Area 1", 2: "Area 2", 3: "Area 3" };
