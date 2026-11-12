import { DB, Schedule } from "./types";
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
/** Interval [mulai, selesai). Jika selesai <= mulai, jadwal melewati tengah malam. */
export function span(s: { start: string; end: string }): [number, number] {
  const a = toMin(s.start); let b = toMin(s.end); if (b <= a) b += 1440; return [a, b];
}
export function overlap(a: Schedule, b: Schedule) {
  const [a1, a2] = span(a), [b1, b2] = span(b);
  const off = (new Date(b.date).getTime() - new Date(a.date).getTime()) / 60000;
  return a1 < b2 + off && b1 + off < a2;
}
export function shift3(hour: number) { return hour >= 6 && hour < 14 ? "Shift 1" : hour >= 14 && hour < 22 ? "Shift 2" : "Shift 3"; }
/** Mengembalikan pesan galat, atau null jika jadwal valid. */
export function validateSchedule(db: DB, s: Schedule): string | null {
  const u = db.units.find(x => x.id === s.unitId); if (!u) return "Unit tidak ditemukan.";
  if (u.status === "Breakdown") return "Unit Breakdown tidak boleh ditugaskan.";
  const a = db.attendance.find(x => x.nik === s.driverNik && x.date === s.date);
  if (!a || a.status !== "Hadir") return "Driver tidak hadir pada tanggal tersebut.";
  const active = db.schedules.filter(x => x.id !== s.id && x.status !== "Dibatalkan");
  if (active.some(x => x.unitId === s.unitId && overlap(x, s))) return "Jadwal unit bertabrakan.";
  if (active.some(x => x.driverNik === s.driverNik && overlap(x, s))) return "Jadwal driver bertabrakan.";
  return null;
}
export const remaining = (r: { qty: number; assigned: number; approved: number }) => r.qty - r.assigned;
