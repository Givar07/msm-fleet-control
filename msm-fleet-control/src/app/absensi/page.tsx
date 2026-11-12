"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AttStatus, Driver } from "@/lib/types";
import { SHIFTS, hours } from "@/lib/shifts";
const STAT: AttStatus[] = ["Hadir", "Izin", "Sakit", "Cuti", "Alpha"];
const COL: Record<AttStatus, string> = { Hadir: "bg-green-100 text-green-800", Izin: "bg-blue-100 text-blue-800", Sakit: "bg-amber-100 text-amber-800", Cuti: "bg-purple-100 text-purple-800", Alpha: "bg-red-100 text-red-800" };
export default function Absensi() {
  const { db, area, role, ready, saveAttendance } = useStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [shiftF, setShiftF] = useState("");
  const [sel, setSel] = useState(""); const [msg, setMsg] = useState("");
  const [f, setF] = useState({ status: "Hadir" as AttStatus, shift: "Shift 1", in: "06:00", out: "", note: "" });
  if (!ready) return null;
  if (role === "user") return <p>Halaman ini tidak tersedia untuk User / Pemohon.</p>;
  const can = role !== "management";
  const rec = (nik: string) => db.attendance.find(a => a.date === date && a.nik === nik);
  const rows = db.drivers.filter(d => d.active && (!area || d.area === area) && (!shiftF || rec(d.nik)?.shift === shiftF));
  const cnt = (s: AttStatus) => rows.filter(d => rec(d.nik)?.status === s).length;
  const belum = rows.filter(d => !rec(d.nik)).length;
  const pct = rows.length ? Math.round(cnt("Hadir") / rows.length * 100) : 0;
  const d0 = db.drivers.find(d => d.nik === sel);
  const open = (d: Driver) => { const r = rec(d.nik); setSel(d.nik); setMsg("");
    setF(r ? { status: r.status, shift: r.shift, in: r.in ?? "", out: r.out ?? "", note: r.note } : { status: "Hadir", shift: "Shift 1", in: "06:00", out: "", note: "" }); };
  const save = () => { if (!d0) return;
    if (f.status === "Hadir" && !f.in) return setMsg("Jam masuk wajib diisi untuk status Hadir.");
    const hd = f.status === "Hadir";
    saveAttendance({ date, nik: d0.nik, shift: f.shift, status: f.status, in: hd ? f.in : undefined, out: hd && f.out ? f.out : undefined, note: f.note.trim() });
    const bentrok = !hd && db.schedules.some(s => s.driverNik === d0.nik && s.date === date && s.status !== "Dibatalkan" && s.status !== "Selesai");
    setMsg(bentrok ? "Tersimpan. Perhatian: driver ini masih punya penugasan aktif pada tanggal tersebut." : "Absensi tersimpan."); };
  const hist = db.attendance.filter(a => a.nik === sel).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Absensi Driver</h1>
      <div className="flex flex-wrap gap-2">
        <input className="inp w-auto" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <select className="inp w-auto" value={shiftF} onChange={e => setShiftF(e.target.value)}><option value="">Semua Shift</option>{Object.keys(SHIFTS).map(s => <option key={s}>{s}</option>)}</select></div>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-7">
        {([["Persen Hadir", pct + "%"], ["Hadir", cnt("Hadir")], ["Izin", cnt("Izin")], ["Sakit", cnt("Sakit")], ["Cuti", cnt("Cuti")], ["Alpha", cnt("Alpha")], ["Belum Diinput", belum]] as const).map(([l, v]) => (
          <div key={l} className="rounded border-l-4 border-gold bg-white p-2 shadow-sm"><div className="text-xs text-gray-500">{l}</div><div className="text-xl font-bold">{v}</div></div>))}</div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm">
        <thead className="bg-navy text-white"><tr>{["Tanggal", "NIK", "Nama Driver", "Area", "Shift", "Masuk", "Pulang", "Status", "Keterangan", ""].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{rows.map(d => { const r = rec(d.nik); return (
          <tr key={d.nik} className="border-t"><td className="p-2">{date}</td><td className="p-2">{d.nik}</td><td className="p-2 font-medium">{d.name}</td><td className="p-2">{d.area}</td>
            <td className="p-2">{r?.shift ?? "-"}</td><td className="p-2">{r?.in ?? "-"}</td><td className="p-2">{r?.out ?? "-"}</td>
            <td className="p-2">{r ? <span className={`rounded px-2 py-0.5 text-xs ${COL[r.status]}`}>{r.status}</span> : <span className="text-gray-400">Belum diinput</span>}</td>
            <td className="p-2">{r?.note || "-"}</td><td className="p-2"><button className="text-blue-700 underline" onClick={() => open(d)}>{can ? (r ? "Edit" : "Input") : "Riwayat"}</button></td></tr>); })}
          {!rows.length && <tr><td className="p-3 text-gray-500" colSpan={10}>Tidak ada driver yang cocok.</td></tr>}</tbody></table></div>
      {d0 && (<div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold">{d0.name} ({d0.nik}) · tanggal {date}</h2>
        {can && (<div className="flex flex-wrap items-center gap-2">
          <select className="inp w-auto" value={f.status} onChange={e => setF({ ...f, status: e.target.value as AttStatus })}>{STAT.map(s => <option key={s}>{s}</option>)}</select>
          <select className="inp w-auto" value={f.shift} onChange={e => setF({ ...f, shift: e.target.value, in: SHIFTS[e.target.value].start })}>
            {Object.entries(SHIFTS).map(([k, v]) => <option key={k} value={k}>{k} ({v.start}–{v.end})</option>)}</select>
          {f.status === "Hadir" && (<><label className="text-xs">Masuk <input className="inp w-auto" type="time" value={f.in} onChange={e => setF({ ...f, in: e.target.value })} /></label>
            <label className="text-xs">Pulang <input className="inp w-auto" type="time" value={f.out} onChange={e => setF({ ...f, out: e.target.value })} /></label></>)}
          <input className="inp w-60" placeholder="Keterangan" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
          <button className="btn" onClick={save}>Simpan Absensi</button></div>)}
        {can && f.status === "Hadir" && f.in && f.out && <p className="text-xs text-gray-500">Durasi kerja: {hours(f.in, f.out)} jam{f.out <= f.in && " (melewati tengah malam)"}</p>}
        {msg && <p className="text-sm font-medium">{msg}</p>}
        <h3 className="text-sm font-semibold">Riwayat Absensi</h3>
        <ul className="text-sm">{hist.map(a => <li key={a.id}>• {a.date} — {a.status}, {a.shift}{a.in && `, ${a.in}–${a.out ?? "?"}`}{a.note && ` (${a.note})`}</li>)}</ul>
      </div>)}
    </div>
  );
}
