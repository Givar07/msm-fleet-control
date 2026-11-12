"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
export default function Dashboard() {
  const { db, area, role, ready } = useStore();
  if (!ready) return null;
  if (role === "user") return <p>Pengguna hanya dapat membuat dan melihat request truk miliknya. Buka menu Request Truk.</p>;
  const f = <T extends { area: number }>(a: T[]) => (area ? a.filter(x => x.area === area) : a);
  const units = f(db.units), reqs = f(db.requests), today = new Date().toISOString().slice(0, 10);
  const att = db.attendance.filter(a => a.date === today && (!area || db.drivers.find(d => d.nik === a.nik)?.area === area));
  const n = (s: string) => units.filter(u => u.status === s).length;
  const hadir = att.filter(a => a.status === "Hadir").length;
  const kpi: [string, string | number][] = [
    ["Total HT", units.filter(u => u.type === "HT").length], ["Total DT", units.filter(u => u.type === "DT").length],
    ["Operational", n("Operational")], ["Standby", n("Standby")], ["Breakdown", n("Breakdown")],
    ["% Operational", units.length ? Math.round(n("Operational") / units.length * 100) + "%" : "0%"],
    ["Driver Hadir", hadir], ["Driver Tidak Hadir", att.length - hadir],
    ["Request Pending", reqs.filter(r => r.status === "Pending").length],
    ["Request Approved", reqs.filter(r => r.status.includes("Approved")).length],
    ["Unit Ditugaskan", f(db.schedules).filter(s => s.date === today && s.status !== "Dibatalkan").length]];
  const chart = ([1, 2, 3] as const).map(a => { const u = db.units.filter(x => x.area === a);
    return { area: `Area ${a}`, Operational: u.filter(x => x.status === "Operational").length,
      Standby: u.filter(x => x.status === "Standby").length, Breakdown: u.filter(x => x.status === "Breakdown").length }; });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard Fleet</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{kpi.map(([l, v]) => (
        <div key={l} className="rounded-lg border-l-4 border-gold bg-white p-3 shadow-sm">
          <div className="text-xs text-gray-500">{l}</div><div className="text-2xl font-bold">{v}</div></div>))}</div>
      <div className="h-72 rounded-lg bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm font-semibold">Status Fleet per Area</div>
        <ResponsiveContainer width="100%" height="90%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="area" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
          <Bar dataKey="Operational" fill="#16a34a" /><Bar dataKey="Standby" fill="#f59e0b" /><Bar dataKey="Breakdown" fill="#dc2626" /></BarChart></ResponsiveContainer>
      </div>
    </div>
  );
}
