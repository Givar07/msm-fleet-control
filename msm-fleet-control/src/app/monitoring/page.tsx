"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Unit, UnitStatus } from "@/lib/types";
const COL: Record<UnitStatus, string> = { Operational: "bg-green-100 text-green-800", Standby: "bg-amber-100 text-amber-800", Breakdown: "bg-red-100 text-red-800" };
export default function Monitoring() {
  const { db, area, role, ready, setUnitStatus } = useStore();
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [st, setSt] = useState("");
  const [sel, setSel] = useState(""); const [ns, setNs] = useState<UnitStatus>("Operational"); const [note, setNote] = useState(""); const [msg, setMsg] = useState("");
  if (!ready) return null;
  if (role === "user") return <p>Halaman ini tidak tersedia untuk User / Pemohon.</p>;
  const can = role !== "management";
  const today = new Date().toISOString().slice(0, 10);
  const live = (u: Unit) => db.schedules.find(s => s.unitId === u.id && s.date === today && (s.status === "Dijadwalkan" || s.status === "Berjalan"));
  const rows = db.units.filter(u => (!area || u.area === area) && (!type || u.type === type) && (!st || u.status === st) && u.id.toLowerCase().includes(q.trim().toLowerCase()));
  const u = db.units.find(x => x.id === sel);
  const open = (x: Unit) => { setSel(x.id); setNs(x.status); setNote(x.note); setMsg(""); };
  const save = () => { if (!u) return;
    if (ns === u.status) return setMsg("Status tidak berubah.");
    if (ns === "Breakdown" && !note.trim()) return setMsg("Isi alasan breakdown.");
    setUnitStatus(u.id, ns, note.trim()); setMsg("Status diperbarui."); };
  const hist = u ? db.history.filter(h => h.unitId === u.id).slice().reverse() : [];
  const jadwal = u ? db.schedules.filter(s => s.unitId === u.id && s.status !== "Dibatalkan" && s.status !== "Selesai").length : 0;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Monitoring Status HT &amp; DT</h1>
      <div className="flex flex-wrap gap-2">
        <input className="inp w-48" placeholder="Cari nomor unit" value={q} onChange={e => setQ(e.target.value)} />
        <select className="inp w-auto" value={type} onChange={e => setType(e.target.value)}><option value="">Semua Jenis</option><option>HT</option><option>DT</option></select>
        <select className="inp w-auto" value={st} onChange={e => setSt(e.target.value)}><option value="">Semua Status</option><option>Operational</option><option>Standby</option><option>Breakdown</option></select>
        <span className="self-center text-sm text-gray-500">{rows.length} unit</span></div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm">
        <thead className="bg-navy text-white"><tr>{["Unit", "Jenis", "Area", "Lokasi", "Kondisi", "Penugasan", "Driver", "Shift", "Update", "Keterangan", ""].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{rows.map(x => { const s = live(x); const drv = s && db.drivers.find(d => d.nik === s.driverNik);
          return (<tr key={x.id} className="border-t">
            <td className="p-2 font-medium">{x.id}</td><td className="p-2">{x.type}</td><td className="p-2">{x.area}</td><td className="p-2">{x.location}</td>
            <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${COL[x.status]}`}>{x.status}</span></td>
            <td className="p-2">{x.status === "Breakdown" ? "Tidak tersedia" : s ? `Bertugas (${s.start}–${s.end})` : "Tersedia"}</td>
            <td className="p-2">{drv ? drv.name : "-"}</td><td className="p-2">{x.shift}</td><td className="p-2">{x.updatedAt.slice(0, 16).replace("T", " ")}</td>
            <td className="p-2">{x.note || "-"}</td><td className="p-2"><button className="text-blue-700 underline" onClick={() => open(x)}>Detail</button></td></tr>); })}
          {!rows.length && <tr><td className="p-3 text-gray-500" colSpan={11}>Tidak ada unit yang cocok.</td></tr>}</tbody></table></div>
      {u && (<div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2"><h2 className="font-semibold">{u.id} · {u.type} · Area {u.area}</h2><span className={`rounded px-2 py-0.5 text-xs ${COL[u.status]}`}>{u.status}</span></div>
        {can ? (<div className="flex flex-wrap items-center gap-2">
          <select className="inp w-auto" value={ns} onChange={e => setNs(e.target.value as UnitStatus)}><option>Operational</option><option>Standby</option><option>Breakdown</option></select>
          <input className="inp w-72" placeholder={ns === "Breakdown" ? "Alasan breakdown (wajib)" : "Keterangan"} value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn" onClick={save}>Simpan Status</button></div>) : <p className="text-xs text-gray-500">Mode lihat saja untuk Management.</p>}
        {can && ns === "Breakdown" && jadwal > 0 && <p className="text-sm text-amber-700">Unit ini masih punya {jadwal} jadwal aktif. Periksa ulang penugasannya setelah status diubah.</p>}
        {msg && <p className="text-sm font-medium">{msg}</p>}
        <h3 className="text-sm font-semibold">Riwayat Perubahan Status</h3>
        {hist.length ? <ul className="text-sm">{hist.map(h => <li key={h.id}>• {h.at.slice(0, 16).replace("T", " ")} — {h.from} → {h.to}{h.note && ` (${h.note})`}</li>)}</ul> : <p className="text-sm text-gray-500">Belum ada perubahan status.</p>}
      </div>)}
    </div>
  );
}
