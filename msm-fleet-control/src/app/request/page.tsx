"use client";
import { FormEvent, useState } from "react";
import { useStore } from "@/lib/store";
import { AREAS, AreaId, UnitType } from "@/lib/types";
export default function RequestPage() {
  const { db, addRequest, role, ready } = useStore();
  const [name, setName] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [f, setF] = useState({ area: 1 as AreaId, type: "HT" as UnitType, qty: 1, date: "", start: "07:00", end: "15:00", destination: "", activity: "", note: "", department: "", phone: "" });
  if (!ready) return null;
  const set = (k: string, v: string | number) => setF({ ...f, [k]: v });
  const submit = (e: FormEvent) => { e.preventDefault(); setMsg("");
    if (!name.trim() || !f.destination.trim() || !f.department.trim() || !f.phone.trim() || !f.activity.trim() || !f.date || f.qty < 1) return setErr("Lengkapi nama, department, no. HP, tanggal, jumlah, tujuan, dan kegiatan.");
    setErr(""); const id = addRequest({ requester: name.trim(), ...f }); setMsg(`Request ${id} berhasil dikirim dengan status Pending.`); };
  const mine = role === "user" ? db.requests.filter(r => name && r.requester.toLowerCase() === name.trim().toLowerCase()) : db.requests;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Request Truk</h1>
        <input className="inp" placeholder="Nama Pemohon" value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-2"><input className="inp" placeholder="Department" value={f.department} onChange={e => set("department", e.target.value)} />
          <input className="inp" placeholder="No. HP Pemohon" value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <select className="inp" value={f.area} onChange={e => set("area", Number(e.target.value))}>{([1, 2, 3] as const).map(a => <option key={a} value={a}>{AREAS[a]}</option>)}</select>
          <select className="inp" value={f.type} onChange={e => set("type", e.target.value)}><option>HT</option><option>DT</option></select>
          <input className="inp" type="number" min={1} value={f.qty} onChange={e => set("qty", Number(e.target.value))} />
          <input className="inp" type="date" value={f.date} onChange={e => set("date", e.target.value)} />
          <input className="inp" type="time" value={f.start} onChange={e => set("start", e.target.value)} />
          <input className="inp" type="time" value={f.end} onChange={e => set("end", e.target.value)} /></div>
        <input className="inp" placeholder="Tujuan / lokasi (petak, reservoir)" value={f.destination} onChange={e => set("destination", e.target.value)} />
        <input className="inp" list="act" placeholder="Nama kegiatan" value={f.activity} onChange={e => set("activity", e.target.value)} />
        <datalist id="act">{(db.activities ?? []).map(a => <option key={a} value={a} />)}</datalist>
        <textarea className="inp" placeholder="Keterangan tambahan" value={f.note} onChange={e => set("note", e.target.value)} />
        {err && <p className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
        <button className="btn">Kirim Request</button>
      </form>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">{role === "user" ? "Request Saya (isi nama pemohon)" : "Semua Request"}</h2>
        <div className="space-y-2">{mine.map(r => (
          <div key={r.id} className="rounded border p-2 text-sm"><b>{r.id}</b> · {r.status}<br />{r.requester} · {r.qty} {r.type} · {r.date} · {r.destination}
            <br /><span className="text-gray-500">Diminta {r.qty} / Disetujui {r.approved} / Ditugaskan {r.assigned} / Sisa {r.qty - r.assigned}</span></div>))}</div>
      </div>
    </div>
  );
}
