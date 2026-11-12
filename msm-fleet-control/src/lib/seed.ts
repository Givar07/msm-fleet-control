import { DB, AreaId, Unit, Driver, UnitStatus, AttStatus } from "./types";
const NAMA = ["Agus","Budi","Charles","Dani","Eko","Fredy","Gunawan","Hendrik","Ivan","Jefri"];
const MARGA = ["Lede","Hawu","Ndapa","Mbani","Kahi","Umbu"];
export function seed(): DB {
  const now = new Date().toISOString(); const today = now.slice(0, 10);
  const st: UnitStatus[] = ["Operational","Operational","Operational","Standby","Breakdown"];
  const units: Unit[] = [];
  (["HT","DT"] as const).forEach(t => { for (let i = 1; i <= 15; i++) units.push({
    id: `${t}-${String(i).padStart(2,"0")}`, type: t, area: ((i % 3) + 1) as AreaId, location: "Lapangan",
    status: st[(i + (t === "DT" ? 2 : 0)) % 5], shift: "Shift 1", updatedAt: now, note: "" }); });
  const drivers: Driver[] = Array.from({ length: 30 }, (_, i) => ({
    nik: `MSM${String(1001 + i)}`, name: `${NAMA[i % 10]} ${MARGA[i % 6]}`, area: ((i % 3) + 1) as AreaId, active: true, phone: `0812-5550-${1001 + i}` }));
  const att: AttStatus[] = ["Hadir","Hadir","Hadir","Hadir","Izin","Sakit"];
  const attendance = drivers.map((d, i) => ({ id: `ATT-${i}`, date: today, nik: d.nik, shift: "Shift 1",
    status: att[i % 6], in: att[i % 6] === "Hadir" ? "06:00" : undefined, out: undefined, note: "" }));
  const base = { date: today, start: "07:00", end: "15:00", note: "", approved: 0, assigned: 0, createdAt: now };
  const requests = [
    { ...base, id: "REQ-0001", requester: "Yohanis Lede", department: "Agronomi", phone: "0813-5550-0001", area: 1 as AreaId, type: "HT" as const, qty: 5, destination: "Petak A-12, Reservoir 3", activity: "Pengangkutan Tebu", status: "Pending" as const },
    { ...base, id: "REQ-0002", requester: "Maria Kahi", department: "Civil", phone: "0813-5550-0002", area: 2 as AreaId, type: "DT" as const, qty: 2, destination: "Petak B-04", activity: "Pengangkutan Tanah", status: "Pending" as const },
    { ...base, id: "REQ-0003", requester: "Daniel Umbu", department: "Workshop", phone: "0813-5550-0003", area: 3 as AreaId, type: "HT" as const, qty: 3, destination: "Petak C-21", activity: "Pengangkutan Tebu", status: "Approved" as const, approved: 3 },
  ];
  return { units, drivers, attendance, requests, schedules: [], history: [], activities: ["Pengangkutan Tebu", "Pengangkutan Tanah", "Pengangkutan Material"] };
}
