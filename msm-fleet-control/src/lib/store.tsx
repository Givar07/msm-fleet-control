"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Attendance, AreaId, DB, ReqStatus, Role, Schedule, TruckRequest, UnitStatus } from "./types";
import { seed } from "./seed";
import { validateSchedule } from "./logic";
const KEY = "msm-fleet-v1";
type NewReq = Omit<TruckRequest, "id" | "status" | "approved" | "assigned" | "createdAt">;
const SCH: Partial<Record<ReqStatus, string>> = { Cancelled: "Dibatalkan", "In Progress": "Berjalan", Completed: "Selesai" };
interface Ctx { db: DB; ready: boolean; role: Role; setRole(r: Role): void; area: 0 | AreaId; setArea(a: 0 | AreaId): void;
  reset(): void; addRequest(r: NewReq): string; setUnitStatus(id: string, s: UnitStatus, note: string): void;
  approve(id: string, qty: number): string | null; reject(id: string, reason: string): void;
  saveAttendance(a: Omit<Attendance, "id">): void; addSchedule(x: Omit<Schedule, "id" | "status">): string | null;
  updateSchedule(id: string, p: Partial<Schedule>): string | null; cancelSchedule(id: string): void; setReqStatus(id: string, s: ReqStatus): void; assign(reqId: string, unitId: string, nik: string): string | null }
const C = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(C);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>({ units: [], drivers: [], attendance: [], requests: [], schedules: [], history: [] });
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("super_admin");
  const [area, setArea] = useState<0 | AreaId>(0);
  useEffect(() => { const raw = localStorage.getItem(KEY); setDb(raw ? JSON.parse(raw) : seed()); setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(db)); }, [db, ready]);
  const reset = () => { localStorage.removeItem(KEY); setDb(seed()); };
  const patchReq = (id: string, p: Partial<TruckRequest>) =>
    setDb(d => ({ ...d, requests: d.requests.map(x => x.id === id ? { ...x, ...p } : x) }));
  const addRequest = (r: NewReq) => {
    const id = `REQ-${String(db.requests.length + 1).padStart(4, "0")}`;
    setDb(d => ({ ...d, requests: [...d.requests, { ...r, id, status: "Pending", approved: 0, assigned: 0, createdAt: new Date().toISOString() }] }));
    return id;
  };
  const setUnitStatus = (id: string, s: UnitStatus, note: string) => setDb(d => {
    const u = d.units.find(x => x.id === id)!; const at = new Date().toISOString();
    return { ...d, units: d.units.map(x => x.id === id ? { ...x, status: s, note, updatedAt: at } : x),
      history: [...d.history, { id: `H-${d.history.length + 1}`, unitId: id, from: u.status, to: s, note, at }] };
  });
  const approve = (id: string, qty: number) => {
    const r = db.requests.find(x => x.id === id)!;
    if (!Number.isInteger(qty) || qty < 1 || qty > r.qty) return `Jumlah disetujui harus 1–${r.qty}.`;
    patchReq(id, { approved: qty, status: qty >= r.qty ? "Approved" : "Partially Approved", rejectReason: undefined }); return null;
  };
  const reject = (id: string, reason: string) => patchReq(id, { status: "Rejected", rejectReason: reason });
  const setReqStatus = (id: string, s: ReqStatus) => setDb(d => ({ ...d,
    requests: d.requests.map(x => x.id === id ? { ...x, status: s } : x),
    schedules: SCH[s] ? d.schedules.map(x => x.requestId === id && x.status !== "Dibatalkan" ? { ...x, status: SCH[s]! } : x) : d.schedules }));
  const assign = (reqId: string, unitId: string, nik: string) => {
    const r = db.requests.find(x => x.id === reqId)!;
    if (r.assigned >= r.approved) return "Jumlah unit yang disetujui sudah terpenuhi.";
    const u = db.units.find(x => x.id === unitId);
    if (u && u.type !== r.type) return "Jenis unit tidak sesuai permintaan.";
    const s: Schedule = { id: `SCH-${String(db.schedules.length + 1).padStart(4, "0")}`, date: r.date, unitId, driverNik: nik, area: r.area,
      destination: r.destination, activity: r.activity, start: r.start, end: r.end, status: "Dijadwalkan", requestId: r.id,
      department: r.department, userName: r.requester, userPhone: r.phone };
    const err = validateSchedule(db, s); if (err) return err;
    const n = r.assigned + 1;
    setDb(d => ({ ...d, schedules: [...d.schedules, s],
      requests: d.requests.map(x => x.id === reqId ? { ...x, assigned: n, status: n >= x.approved ? "Assigned" : x.status } : x) }));
    return null;
  };
  const addSchedule = (x: Omit<Schedule, "id" | "status">) => {
    const s: Schedule = { ...x, id: `SCH-${String(db.schedules.length + 1).padStart(4, "0")}`, status: "Dijadwalkan" };
    const err = validateSchedule(db, s); if (err) return err;
    setDb(d => ({ ...d, schedules: [...d.schedules, s] })); return null;
  };
  const updateSchedule = (id: string, p: Partial<Schedule>) => {
    const s = { ...db.schedules.find(x => x.id === id)!, ...p };
    const err = validateSchedule(db, s); if (err) return err;
    setDb(d => ({ ...d, schedules: d.schedules.map(x => x.id === id ? s : x) })); return null;
  };
  const cancelSchedule = (id: string) => setDb(d => ({ ...d, schedules: d.schedules.map(x => x.id === id ? { ...x, status: "Dibatalkan" } : x) }));
  const saveAttendance = (a: Omit<Attendance, "id">) => setDb(d => {
    const i = d.attendance.findIndex(x => x.date === a.date && x.nik === a.nik);
    if (i >= 0) { const c = [...d.attendance]; c[i] = { ...c[i], ...a }; return { ...d, attendance: c }; }
    return { ...d, attendance: [...d.attendance, { ...a, id: `ATT-${a.date}-${a.nik}` }] };
  });
  return <C.Provider value={{ db, ready, role, setRole, area, setArea, reset, addRequest, setUnitStatus, approve, reject, saveAttendance, addSchedule, updateSchedule, cancelSchedule, setReqStatus, assign }}>{children}</C.Provider>;
}
