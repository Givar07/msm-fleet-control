"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AreaId, DB, Role, TruckRequest, UnitStatus } from "./types";
import { seed } from "./seed";
const KEY = "msm-fleet-v1";
type NewReq = Omit<TruckRequest, "id" | "status" | "approved" | "assigned" | "createdAt">;
interface Ctx { db: DB; ready: boolean; role: Role; setRole(r: Role): void; area: 0 | AreaId; setArea(a: 0 | AreaId): void;
  reset(): void; addRequest(r: NewReq): string; setUnitStatus(id: string, s: UnitStatus, note: string): void }
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
  return <C.Provider value={{ db, ready, role, setRole, area, setArea, reset, addRequest, setUnitStatus }}>{children}</C.Provider>;
}
