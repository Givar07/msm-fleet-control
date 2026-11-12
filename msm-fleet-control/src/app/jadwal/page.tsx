"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AreaId, Schedule } from "@/lib/types";
import { span } from "@/lib/logic";
const today = () => new Date().toISOString().slice(0, 10);
const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const ST: Record<string, string> = { Dijadwalkan: "bg-blue-200", Berjalan: "bg-green-300", Selesai: "bg-gray-300", Dibatalkan: "bg-red-100 line-through" };
const blank = (d: string, a: number) => ({ date: d, unitId: "", nik: "", area: (a || 1) as AreaId, destination: "", activity: "", start: "07:00", end: "15:00", requestId: "" });
const week = (d: string) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() - (t.getUTCDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(t); x.setUTCDate(t.getUTCDate() + i); return x.toISOString().slice(0, 10); }); };
export default function Jadwal() {
  const { db, area, role, ready, addSchedule, updateSchedule, cancelSchedule } = useStore();
  const [view, setView] = useState<"hari" | "minggu" | "daftar">("hari"); const [date, setDate] = useState(today()); const [unitF, setUnitF] = useState("");
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState(""); const [f, setF] = useState(blank(today(), 0)); const [msg, setMsg] = useState("");
  if (!ready) return null;
  if (role === "user") return <p>Halaman ini tidak tersedia untuk User / Pemohon.</p>;
  const can = role !== "management";
  const all = db.schedules.filter(s => (!area || s.area === area) && (!unitF || s.unitId === unitF));
  const aktif = all.filter(s => s.status !== "Dibatalkan");
  const dayList = aktif.filter(s => s.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const drv = (nik: string) => db.drivers.find(d => d.nik === nik)?.name ?? nik;
  const startNew = () => { setEditId(""); setF(blank(date, area)); setMsg(""); setOpen(true); };
  const startEdit = (s: Schedule) => { if (!can || s.status === "Selesai" || s.status === "Dibatalkan") return;
    setEditId(s.id); setF({ date: s.date, unitId: s.unitId, nik: s.driverNik, area: s.area, destination: s.destination, activity: s.activity, start: s.start, end: s.end, requestId: s.requestId ?? "" }); setMsg(""); setOpen(true); };
  const save = () => {
    if (!f.unitId || !f.nik || !f.date || !f.destination.trim() || !f.activity.trim()) return setMsg("Lengkapi tanggal, unit, driver, tujuan, dan kegiatan.");
    const b = { date: f.date, unitId: f.unitId, driverNik: f.nik, area: f.area, destination: f.destination.trim(), activity: f.activity.trim(), start: f.start, end: f.end, requestId: f.requestId || undefined };
    const e = editId ? updateSchedule(editId, b) : addSchedule(b);
    if (e) return setMsg(e); setOpen(false); setMsg(""); };
  const hadir = db.drivers.filter(d => d.active && (d.nik === f.nik || db.attendance.some(a => a.nik === d.nik && a.date === f.date && a.status === "Hadir")));
  const reqs = db.requests.filter(r => ["Approved", "Partially Approved", "Assigned", "In Progress"].includes(r.status));
  const set = (k: string, v: string | number) => setF({ ...f, [k]: v });
  const units = Array.from(new Set(dayList.map(s => s.unitId)));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Jadwal Kendaraan</h1>
      <div className="flex flex-wrap items-center gap-2">
        {(["hari", "minggu", "daftar"] as const).map(v => <button key={v} className={`rounded-md px-3 py-2 text-sm ${view === v ? "bg-gold text-navy" : "bg-white"}`} onClick={() => setView(v)}>{v === "hari" ? "Harian" : v === "minggu" ? "Mingguan" : "Daftar"}</button>)}
        <input className="inp w-auto" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <select className="inp w-auto" value={unitF} onChange={e => setUnitF(e.target.value)}><option value="">Semua Kendaraan</option>{db.units.map(u => <option key={u.id}>{u.id}</option>)}</select>
        {can && <button className="btn ml-auto" onClick={startNew}>Tambah Jadwal</button>}</div>
      <p className="text-sm text-gray-600">Unit digunakan pada {date}: <b>{units.length}</b>{units.length > 0 && ` (${units.join(", ")})`}</p>
      {open && (<div className="space-y-2 rounded-lg bg-white p-4 shadow-sm"><h2 className="font-semibold">{editId ? `Edit ${editId}` : "Jadwal Baru"}</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="inp" type="date" value={f.date} onChange={e => set("date", e.target.value)} />
          <select className="inp" value={f.unitId} onChange={e => set("unitId", e.target.value)}><option value="">Pilih unit</option>{db.units.map(u => <option key={u.id} value={u.id}>{u.id} ({u.status})</option>)}</select>
          <select className="inp" value={f.nik} onChange={e => set("nik", e.target.value)}><option value="">Driver hadir ({hadir.length})</option>{hadir.map(d => <option key={d.nik} value={d.nik}>{d.name}</option>)}</select>
          <select className="inp" value={f.area} onChange={e => set("area", Number(e.target.value))}>{[1, 2, 3].map(a => <option key={a} value={a}>Area {a}</option>)}</select>
          <input className="inp" placeholder="Tujuan" value={f.destination} onChange={e => set("destination", e.target.value)} />
          <input className="inp" placeholder="Kegiatan" value={f.activity} onChange={e => set("activity", e.target.value)} />
          <input className="inp" type="time" value={f.start} onChange={e => set("start", e.target.value)} />
          <input className="inp" type="time" value={f.end} onChange={e => set("end", e.target.value)} /></div>
        <select className="inp" value={f.requestId} onChange={e => set("requestId", e.target.value)}><option value="">Tanpa tautan request</option>{reqs.map(r => <option key={r.id} value={r.id}>{r.id} — {r.requester}</option>)}</select>
        {msg && <p className="text-sm font-medium text-red-700">{msg}</p>}
        <div className="flex gap-2"><button className="btn" onClick={save}>Simpan</button><button className="btn bg-gray-600" onClick={() => setOpen(false)}>Tutup</button></div></div>)}
      {view === "hari" && (<div className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
        <div className="ml-[72px] flex justify-between text-[10px] text-gray-500"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
        {units.map(u => (<div key={u} className="flex items-center gap-2"><div className="w-16 text-xs font-medium">{u}</div><div className="relative h-8 flex-1 rounded bg-gray-100">
          {dayList.filter(s => s.unitId === u).map(s => { const [a, b] = span(s); return (
            <button key={s.id} title={`${s.destination} — ${s.activity}`} onClick={() => startEdit(s)} className={`absolute top-0 h-8 overflow-hidden rounded px-1 text-left text-[10px] ${ST[s.status]}`}
              style={{ left: `${a / 14.4}%`, width: `${(Math.min(b, 1440) - a) / 14.4}%` }}>{s.start}–{s.end} {drv(s.driverNik)}</button>); })}</div></div>))}
        {!units.length && <p className="text-sm text-gray-500">Tidak ada jadwal pada tanggal ini.</p>}</div>)}
      {view === "minggu" && (<div className="overflow-x-auto"><div className="grid min-w-[760px] grid-cols-7 gap-1">
        {week(date).map((d, i) => (<div key={d} className="min-h-[120px] rounded bg-white p-2 shadow-sm"><div className="mb-1 text-xs font-semibold">{HARI[i]} {d.slice(5)}</div>
          {aktif.filter(s => s.date === d).sort((a, b) => a.start.localeCompare(b.start)).map(s => (
            <button key={s.id} onClick={() => startEdit(s)} className={`mb-1 block w-full rounded px-1 py-0.5 text-left text-[11px] ${ST[s.status]}`}>{s.unitId} {s.start}–{s.end}<br />{drv(s.driverNik)}</button>))}</div>))}</div></div>)}
      {view === "daftar" && (<div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm">
        <thead className="bg-navy text-white"><tr>{["Tanggal", "Unit", "Jenis", "Driver", "Area", "Tujuan", "Kegiatan", "Mulai", "Selesai", "Status", "Request", ""].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{all.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).map(s => (
          <tr key={s.id} className="border-t"><td className="p-2">{s.date}</td><td className="p-2 font-medium">{s.unitId}</td><td className="p-2">{db.units.find(u => u.id === s.unitId)?.type}</td><td className="p-2">{drv(s.driverNik)}</td>
            <td className="p-2">{s.area}</td><td className="p-2">{s.destination}</td><td className="p-2">{s.activity}</td><td className="p-2">{s.start}</td><td className="p-2">{s.end}</td>
            <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${ST[s.status]}`}>{s.status}</span></td><td className="p-2">{s.requestId ?? "-"}</td>
            <td className="space-x-2 p-2">{can && s.status !== "Dibatalkan" && s.status !== "Selesai" && (<><button className="text-blue-700 underline" onClick={() => startEdit(s)}>Edit</button>
              <button className="text-red-700 underline" onClick={() => confirm("Batalkan jadwal ini?") && cancelSchedule(s.id)}>Batalkan</button></>)}</td></tr>))}
          {!all.length && <tr><td className="p-3 text-gray-500" colSpan={12}>Belum ada jadwal.</td></tr>}</tbody></table></div>)}
    </div>
  );
}
