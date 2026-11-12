"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { ReqStatus } from "@/lib/types";
const COLOR: Record<ReqStatus, string> = { Pending: "bg-amber-100 text-amber-800", "Under Review": "bg-blue-100 text-blue-800", Approved: "bg-green-100 text-green-800",
  "Partially Approved": "bg-lime-100 text-lime-800", Rejected: "bg-red-100 text-red-800", Assigned: "bg-indigo-100 text-indigo-800",
  "In Progress": "bg-cyan-100 text-cyan-800", Completed: "bg-gray-200 text-gray-800", Cancelled: "bg-gray-100 text-gray-500" };
export default function AdminRequests() {
  const { db, area, role, ready, approve, reject, setReqStatus, assign } = useStore();
  const [sel, setSel] = useState(""); const [qty, setQty] = useState(1); const [reason, setReason] = useState("");
  const [unit, setUnit] = useState(""); const [nik, setNik] = useState(""); const [msg, setMsg] = useState("");
  if (!ready) return null;
  if (role === "user") return <p>Halaman ini hanya untuk Fleet Admin, Admin Area, dan Management.</p>;
  const can = role === "super_admin";
  const list = (area ? db.requests.filter(r => r.area === area) : db.requests).slice().reverse();
  const r = db.requests.find(x => x.id === sel);
  const open = (id: string, q: number) => { setSel(id); setQty(q); setMsg(""); setReason(""); setUnit(""); setNik(""); };
  const run = (e: string | null, ok = "Berhasil.") => setMsg(e ?? ok);
  const units = r ? db.units.filter(u => u.type === r.type && u.status !== "Breakdown") : [];
  const hadir = r ? db.drivers.filter(d => d.active && db.attendance.some(a => a.nik === d.nik && a.date === r.date && a.status === "Hadir")) : [];
  const sch = r ? db.schedules.filter(s => s.requestId === r.id) : [];
  const final = r ? ["Rejected", "Completed", "Cancelled"].includes(r.status) : true;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Admin Request Truk</h1>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm">
        <thead className="bg-navy text-white"><tr>{["Request ID", "Tgl Request", "Pemohon", "Area", "Jenis", "Unit", "Penggunaan", "Tujuan", "Kegiatan", "Status", ""].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>{list.map(x => (
          <tr key={x.id} className="border-t">
            <td className="p-2 font-medium">{x.id}</td><td className="p-2">{x.createdAt.slice(0, 10)}</td><td className="p-2">{x.requester}</td><td className="p-2">{x.area}</td>
            <td className="p-2">{x.type}</td><td className="p-2">{x.qty}</td><td className="p-2">{x.date} {x.start}–{x.end}</td><td className="p-2">{x.destination}</td><td className="p-2">{x.activity}</td>
            <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${COLOR[x.status]}`}>{x.status}</span></td>
            <td className="p-2"><button className="text-blue-700 underline" onClick={() => open(x.id, x.qty)}>Detail</button></td></tr>))}
          {!list.length && <tr><td className="p-3 text-gray-500" colSpan={11}>Belum ada request.</td></tr>}</tbody></table></div>
      {r && (
        <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><h2 className="font-semibold">{r.id} — {r.requester}</h2><span className={`rounded px-2 py-0.5 text-xs ${COLOR[r.status]}`}>{r.status}</span></div>
          <p className="text-sm">{r.type} · Area {r.area} · {r.date} {r.start}–{r.end} · {r.destination} · {r.activity}{r.note && ` · ${r.note}`}</p>
          {r.rejectReason && <p className="text-sm text-red-700">Alasan penolakan: {r.rejectReason}</p>}
          <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
            {([["Diminta", r.qty], ["Disetujui", r.approved], ["Ditugaskan", r.assigned], ["Sisa", r.qty - r.assigned]] as const).map(([l, v]) => (
              <div key={l} className="rounded border-l-4 border-gold bg-gray-50 p-2"><div className="text-xs text-gray-500">{l}</div><div className="text-xl font-bold">{v}</div></div>))}</div>
          {sch.length > 0 && <ul className="text-sm">{sch.map(s => <li key={s.id}>• {s.unitId} — {db.drivers.find(d => d.nik === s.driverNik)?.name} ({s.status})</li>)}</ul>}
          {can && !final && (<div className="space-y-3 border-t pt-3">
            {r.status === "Pending" && <button className="btn" onClick={() => setReqStatus(r.id, "Under Review")}>Tandai Under Review</button>}
            {(r.status === "Pending" || r.status === "Under Review") && (<div className="flex flex-wrap items-center gap-2">
              <input className="inp w-24" type="number" min={1} max={r.qty} value={qty} onChange={e => setQty(Number(e.target.value))} />
              <button className="btn" onClick={() => run(approve(r.id, qty), "Request disetujui.")}>Setujui ({qty} unit)</button>
              <input className="inp w-56" placeholder="Alasan penolakan" value={reason} onChange={e => setReason(e.target.value)} />
              <button className="btn bg-red-700" onClick={() => reason.trim() ? reject(r.id, reason.trim()) : setMsg("Isi alasan penolakan.")}>Tolak</button></div>)}
            {r.approved > 0 && r.assigned < r.approved && (<div className="flex flex-wrap items-center gap-2">
              <select className="inp w-auto" value={unit} onChange={e => setUnit(e.target.value)}><option value="">Pilih unit {r.type}</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.id} ({u.status}, Area {u.area})</option>)}</select>
              <select className="inp w-auto" value={nik} onChange={e => setNik(e.target.value)}><option value="">Pilih driver hadir ({hadir.length})</option>
                {hadir.map(d => <option key={d.nik} value={d.nik}>{d.name} (Area {d.area})</option>)}</select>
              <button className="btn" disabled={!unit || !nik} onClick={() => run(assign(r.id, unit, nik), "Unit dan driver ditugaskan.")}>Tugaskan</button></div>)}
            <div className="flex gap-2">
              {r.assigned > 0 && r.status !== "In Progress" && <button className="btn" onClick={() => setReqStatus(r.id, "In Progress")}>Mulai</button>}
              {r.status === "In Progress" && <button className="btn" onClick={() => setReqStatus(r.id, "Completed")}>Selesaikan</button>}
              <button className="btn bg-gray-600" onClick={() => confirm("Batalkan request ini?") && setReqStatus(r.id, "Cancelled")}>Batalkan</button></div>
          </div>)}
          {!can && <p className="text-xs text-gray-500">Mode lihat saja. Hanya Fleet Super Admin yang dapat memproses request.</p>}
          {msg && <p className="text-sm font-medium">{msg}</p>}
        </div>)}
    </div>
  );
}
