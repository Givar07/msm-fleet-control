"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { Attendance, AreaId, DB, Driver, ReqStatus, Role, Schedule, TruckRequest, Unit, UnitStatus } from "./types";
import { seed } from "./seed";
import { validateSchedule } from "./logic";
import { getSupabase, SupabaseClient } from "./supabase";
const KEY = "msm-fleet-v1";
const uid = (p: string) => `${p}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const EMPTY: DB = { units: [], drivers: [], attendance: [], requests: [], schedules: [], history: [], activities: [] };
type L = "units" | "drivers" | "attendance" | "requests" | "schedules" | "history";
type Prev = Record<string, Map<string, string>>;
const TBL: { t: L; key: (r: any) => string; area: (r: any) => number | null }[] = [
  { t: "units", key: r => r.id, area: r => r.area }, { t: "drivers", key: r => r.nik, area: r => r.area },
  { t: "attendance", key: r => r.id, area: () => null }, { t: "requests", key: r => r.id, area: r => r.area },
  { t: "schedules", key: r => r.id, area: r => r.area }, { t: "history", key: r => r.id, area: () => null },
];
async function loadAll(sb: SupabaseClient) {
  const out: any = { ...EMPTY }; const pv: Prev = {};
  for (const T of TBL) { const { data } = await sb.from(T.t).select("data"); const arr = (data ?? []).map((x: any) => x.data);
    out[T.t] = arr; pv[T.t] = new Map<string, string>(arr.map((r: any) => [T.key(r), JSON.stringify(r)] as [string, string])); }
  const { data: s } = await sb.from("settings").select("data").eq("id", "activities").maybeSingle();
  out.activities = s?.data?.list ?? []; return { db: out as DB, pv, act: JSON.stringify(out.activities) };
}
/** Kirim hanya baris yang berubah (upsert) atau hilang (delete). prev diperbarui lebih dulu agar tidak terkirim dua kali. */
async function push(sb: SupabaseClient, prev: Prev, db: DB, role: string) {
  const jobs: PromiseLike<any>[] = [];
  for (const T of TBL) {
    const old = prev[T.t] ?? new Map<string, string>(); const cur = new Map<string, string>(); const rows: any[] = [];
    for (const r of db[T.t] as any[]) { const k = T.key(r), s = JSON.stringify(r); cur.set(k, s); if (old.get(k) !== s) rows.push({ id: k, area: T.area(r), data: r }); }
    const del = Array.from(old.keys()).filter(k => !cur.has(k)); prev[T.t] = cur;
    if (rows.length) jobs.push(role === "user" ? sb.from(T.t).insert(rows) : sb.from(T.t).upsert(rows));
    if (del.length) jobs.push(sb.from(T.t).delete().in("id", del));
  }
  (await Promise.all(jobs)).forEach((r: any) => r?.error && console.error(r.error));
}
type NewReq = Omit<TruckRequest, "id" | "status" | "approved" | "assigned" | "createdAt">;
const SCH: Partial<Record<ReqStatus, string>> = { Cancelled: "Dibatalkan", "In Progress": "Berjalan", Completed: "Selesai" };
interface Ctx { db: DB; full: DB; ready: boolean; role: Role; setRole(r: Role): void; area: 0 | AreaId; setArea(a: 0 | AreaId): void; reset(): void;
  cloud: boolean; authReady: boolean; session: boolean; profileMissing: boolean; userName: string; login(e: string, p: string): Promise<string | null>; logout(): void;
  addRequest(r: NewReq): string; setUnitStatus(id: string, s: UnitStatus, note: string): void; approve(id: string, qty: number): string | null; reject(id: string, reason: string): void;
  saveAttendance(a: Omit<Attendance, "id">): void; addSchedule(x: Omit<Schedule, "id" | "status">): string | null; updateSchedule(id: string, p: Partial<Schedule>): string | null; cancelSchedule(id: string): void;
  saveUnit(u: Unit, isNew: boolean): string | null; saveDriver(r: Driver, isNew: boolean): string | null; setActive(kind: "unit" | "driver", id: string, active: boolean): void; saveActivities(a: string[]): void;
  setReqStatus(id: string, s: ReqStatus): void; assign(reqId: string, unitId: string, nik: string): string | null }
const C = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(C);
export function StoreProvider({ children }: { children: ReactNode }) {
  const sb = getSupabase(); const cloud = !!sb;
  const [db, setDb] = useState<DB>(EMPTY); const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("super_admin"); const [area, setArea] = useState<0 | AreaId>(0);
  const [authReady, setAuthReady] = useState(!cloud); const [session, setSession] = useState(false); const [profileMissing, setPM] = useState(false); const [userName, setUserName] = useState("");
  const prev = useRef<Prev>({}); const prevAct = useRef(""); const cur = useRef<string | null>(null); const roleRef = useRef<Role>("super_admin");
  useEffect(() => { if (cloud) return; const raw = localStorage.getItem(KEY); setDb(raw ? JSON.parse(raw) : seed()); setReady(true); }, []);
  useEffect(() => { if (!cloud && ready) localStorage.setItem(KEY, JSON.stringify(db)); }, [db, ready]);
  const onRemote = (p: any) => {
    if (p.table === "settings") { if (p.eventType !== "DELETE" && p.new?.id === "activities") { const l = p.new.data?.list ?? []; prevAct.current = JSON.stringify(l); setDb(d => ({ ...d, activities: l })); } return; }
    const T = TBL.find(x => x.t === p.table); if (!T) return;
    if (p.eventType === "DELETE") { const k = p.old?.id; if (!k) return; prev.current[T.t]?.delete(k); setDb(d => ({ ...d, [T.t]: (d[T.t] as any[]).filter(x => T.key(x) !== k) }) as DB); return; }
    const row = p.new?.data; if (!row) return; const k = T.key(row);
    if (!prev.current[T.t]) prev.current[T.t] = new Map(); prev.current[T.t].set(k, JSON.stringify(row));
    setDb(d => { const a = d[T.t] as any[]; const i = a.findIndex(x => T.key(x) === k); return { ...d, [T.t]: i >= 0 ? a.map((x, j) => (j === i ? row : x)) : [...a, row] } as DB; });
  };
  useEffect(() => {
    if (!sb) return; let ch: any = null;
    const boot = async (userId: string | null) => {
      if (userId === cur.current && authReady) return; cur.current = userId;
      if (ch) { sb.removeChannel(ch); ch = null; }
      if (!userId) { prev.current = {}; setDb(EMPTY); setReady(false); setSession(false); setAuthReady(true); return; }
      setSession(true);
      const { data: p } = await sb.from("profiles").select("name,role,area").eq("id", userId).maybeSingle();
      if (!p) { setPM(true); setAuthReady(true); return; }
      setPM(false); setRole(p.role as Role); roleRef.current = p.role as Role; setUserName(p.name ?? ""); setArea(p.role === "admin_area" && p.area ? (p.area as AreaId) : 0);
      const l = await loadAll(sb); prev.current = l.pv; prevAct.current = l.act; setDb(l.db);
      ch = sb.channel("sync").on("postgres_changes", { event: "*", schema: "public" }, onRemote).subscribe();
      setReady(true); setAuthReady(true);
    };
    sb.auth.getSession().then(({ data }) => boot(data.session?.user.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((ev, s) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") boot(s?.user.id ?? null); });
    return () => { sub.subscription.unsubscribe(); if (ch) sb.removeChannel(ch); };
  }, []);
  useEffect(() => {
    if (!sb || !ready) return;
    push(sb, prev.current, db, roleRef.current).then(async () => { const a = JSON.stringify(db.activities ?? []);
      if (a !== prevAct.current) { prevAct.current = a; const r = await sb.from("settings").upsert({ id: "activities", data: { list: db.activities ?? [] } }); if (r.error) console.error(r.error); } });
  }, [db, ready]);
  const login = async (email: string, pw: string) => { const { error } = await sb!.auth.signInWithPassword({ email, password: pw }); return error ? "Email atau password salah." : null; };
  const logout = () => { sb?.auth.signOut(); };
  const reset = () => { if (cloud) setDb(seed()); else { localStorage.removeItem(KEY); setDb(seed()); } };
  const patchReq = (id: string, p: Partial<TruckRequest>) => setDb(d => ({ ...d, requests: d.requests.map(x => (x.id === id ? { ...x, ...p } : x)) }));
  const addRequest = (r: NewReq) => { const id = uid("REQ");
    setDb(d => ({ ...d, requests: [...d.requests, { ...r, id, status: "Pending", approved: 0, assigned: 0, createdAt: new Date().toISOString() }] })); return id; };
  const setUnitStatus = (id: string, s: UnitStatus, note: string) => setDb(d => { const u = d.units.find(x => x.id === id)!; const at = new Date().toISOString();
    return { ...d, units: d.units.map(x => (x.id === id ? { ...x, status: s, note, updatedAt: at } : x)), history: [...d.history, { id: uid("H"), unitId: id, from: u.status, to: s, note, at }] }; });
  const approve = (id: string, qty: number) => { const r = db.requests.find(x => x.id === id)!;
    if (!Number.isInteger(qty) || qty < 1 || qty > r.qty) return `Jumlah disetujui harus 1–${r.qty}.`;
    patchReq(id, { approved: qty, status: qty >= r.qty ? "Approved" : "Partially Approved", rejectReason: undefined }); return null; };
  const reject = (id: string, reason: string) => patchReq(id, { status: "Rejected", rejectReason: reason });
  const setReqStatus = (id: string, s: ReqStatus) => setDb(d => ({ ...d, requests: d.requests.map(x => (x.id === id ? { ...x, status: s } : x)),
    schedules: SCH[s] ? d.schedules.map(x => (x.requestId === id && x.status !== "Dibatalkan" ? { ...x, status: SCH[s]! } : x)) : d.schedules }));
  const assign = (reqId: string, unitId: string, nik: string) => { const r = db.requests.find(x => x.id === reqId)!;
    if (r.assigned >= r.approved) return "Jumlah unit yang disetujui sudah terpenuhi.";
    const u = db.units.find(x => x.id === unitId); if (u && u.type !== r.type) return "Jenis unit tidak sesuai permintaan.";
    const s: Schedule = { id: uid("SCH"), date: r.date, unitId, driverNik: nik, area: r.area, destination: r.destination, activity: r.activity, start: r.start, end: r.end,
      status: "Dijadwalkan", requestId: r.id, department: r.department, userName: r.requester, userPhone: r.phone };
    const err = validateSchedule(db, s); if (err) return err; const n = r.assigned + 1;
    setDb(d => ({ ...d, schedules: [...d.schedules, s], requests: d.requests.map(x => (x.id === reqId ? { ...x, assigned: n, status: n >= x.approved ? "Assigned" : x.status } : x)) })); return null; };
  const addSchedule = (x: Omit<Schedule, "id" | "status">) => { const s: Schedule = { ...x, id: uid("SCH"), status: "Dijadwalkan" };
    const err = validateSchedule(db, s); if (err) return err; setDb(d => ({ ...d, schedules: [...d.schedules, s] })); return null; };
  const updateSchedule = (id: string, p: Partial<Schedule>) => { const s = { ...db.schedules.find(x => x.id === id)!, ...p };
    const err = validateSchedule(db, s); if (err) return err; setDb(d => ({ ...d, schedules: d.schedules.map(x => (x.id === id ? s : x)) })); return null; };
  const cancelSchedule = (id: string) => setDb(d => ({ ...d, schedules: d.schedules.map(x => (x.id === id ? { ...x, status: "Dibatalkan" } : x)) }));
  const saveUnit = (u: Unit, isNew: boolean) => { const id = u.id.trim().toUpperCase(); if (!id) return "Nomor unit wajib diisi.";
    if (isNew && db.units.some(x => x.id === id)) return "Nomor unit sudah ada."; const n = { ...u, id, updatedAt: new Date().toISOString() };
    setDb(d => ({ ...d, units: isNew ? [...d.units, n] : d.units.map(x => (x.id === id ? { ...x, type: n.type, area: n.area, location: n.location } : x)) })); return null; };
  const saveDriver = (r: Driver, isNew: boolean) => { const nik = r.nik.trim(); if (!nik || !r.name.trim()) return "NIK dan nama wajib diisi.";
    if (isNew && db.drivers.some(x => x.nik === nik)) return "NIK sudah ada."; const n = { ...r, nik, name: r.name.trim(), phone: r.phone?.trim() };
    setDb(d => ({ ...d, drivers: isNew ? [...d.drivers, n] : d.drivers.map(x => (x.nik === nik ? { ...x, ...n } : x)) })); return null; };
  const setActive = (kind: "unit" | "driver", id: string, active: boolean) => setDb(d => (kind === "unit"
    ? { ...d, units: d.units.map(x => (x.id === id ? { ...x, active } : x)) } : { ...d, drivers: d.drivers.map(x => (x.nik === id ? { ...x, active } : x)) }));
  const saveActivities = (a: string[]) => setDb(d => ({ ...d, activities: a }));
  const saveAttendance = (a: Omit<Attendance, "id">) => setDb(d => { const i = d.attendance.findIndex(x => x.date === a.date && x.nik === a.nik);
    if (i >= 0) { const c = [...d.attendance]; c[i] = { ...c[i], ...a }; return { ...d, attendance: c }; }
    return { ...d, attendance: [...d.attendance, { ...a, id: `ATT-${a.date}-${a.nik}` }] }; });
  const view = useMemo(() => ({ ...db, units: db.units.filter(u => u.active !== false) }), [db]);
  return <C.Provider value={{ db: view, full: db, ready, role, setRole, area, setArea, reset, cloud, authReady, session, profileMissing, userName, login, logout, addRequest, setUnitStatus, approve, reject,
    saveAttendance, addSchedule, updateSchedule, cancelSchedule, saveUnit, saveDriver, setActive, saveActivities, setReqStatus, assign }}>{children}</C.Provider>;
}
