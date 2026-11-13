"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Driver, Unit } from "@/lib/types";
type Tab = "unit" | "driver" | "area" | "shift" | "kegiatan";
const TABS: [Tab, string][] = [["unit", "HT & DT"], ["driver", "Driver"], ["area", "Area"], ["shift", "Shift"], ["kegiatan", "Jenis Kegiatan"]];
const newU = (): Unit => ({ id: "", type: "HT", area: 1, location: "Lapangan", status: "Standby", shift: "Shift 1", updatedAt: "", note: "" });
const newD = (): Driver => ({ nik: "", name: "", area: 1, active: true, phone: "" });
export default function Master() {
  const { full, role, ready, saveUnit, saveDriver, setActive, saveActivities } = useStore();
  const [tab, setTab] = useState<Tab>("unit"); const [q, setQ] = useState(""); const [open, setOpen] = useState(false); const [isNew, setIsNew] = useState(true);
  const [u, setU] = useState(newU()); const [d, setD] = useState(newD()); const [act, setAct] = useState(""); const [msg, setMsg] = useState("");
  if (!ready) return null;
  if (role !== "super_admin") return <p>Master Data hanya dapat diakses Fleet Analyst.</p>;
  const lq = q.trim().toLowerCase();
  const units = full.units.filter(x => x.id.toLowerCase().includes(lq) || x.location.toLowerCase().includes(lq));
  const drivers = full.drivers.filter(x => x.nik.toLowerCase().includes(lq) || x.name.toLowerCase().includes(lq));
  const acts = full.activities ?? [];
  const go = (t: Tab) => { setTab(t); setOpen(false); setQ(""); setMsg(""); };
  const sure = (busy: boolean) => !busy || confirm("Masih punya jadwal aktif. Tetap nonaktifkan?");
  const done = (e: string | null) => { if (e) return setMsg(e); setOpen(false); setMsg(""); };
  const toggleU = (x: Unit) => { const on = x.active !== false;
    if (on && !sure(full.schedules.some(s => s.unitId === x.id && s.status !== "Dibatalkan" && s.status !== "Selesai"))) return; setActive("unit", x.id, !on); };
  const toggleD = (x: Driver) => { if (x.active && !sure(full.schedules.some(s => s.driverNik === x.nik && s.status !== "Dibatalkan" && s.status !== "Selesai"))) return; setActive("driver", x.nik, !x.active); };
  const addAct = () => { const a = act.trim(); if (!a) return; if (acts.some(x => x.toLowerCase() === a.toLowerCase())) return setMsg("Jenis kegiatan sudah ada."); saveActivities([...acts, a]); setAct(""); setMsg(""); };
  const Aksi = ({ on, edit, toggle }: { on: boolean; edit: () => void; toggle: () => void }) => (
    <td className="space-x-2 p-2"><button className="text-blue-700 underline" onClick={edit}>Edit</button>
      <button className={on ? "text-red-700 underline" : "text-green-700 underline"} onClick={toggle}>{on ? "Nonaktifkan" : "Aktifkan"}</button></td>);
  const Th = ({ h }: { h: string[] }) => <thead className="bg-navy text-white"><tr>{h.map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Master Data</h1>
      <div className="flex flex-wrap gap-2">{TABS.map(([k, l]) => <button key={k} className={`rounded-md px-3 py-2 text-sm ${tab === k ? "bg-gold text-navy" : "bg-white"}`} onClick={() => go(k)}>{l}</button>)}</div>
      {(tab === "unit" || tab === "driver") && (<div className="flex flex-wrap gap-2">
        <input className="inp w-56" placeholder={tab === "unit" ? "Cari nomor unit / lokasi" : "Cari NIK / nama"} value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn" onClick={() => { setIsNew(true); setU(newU()); setD(newD()); setMsg(""); setOpen(true); }}>Tambah {tab === "unit" ? "Unit" : "Driver"}</button></div>)}
      {open && tab === "unit" && (<div className="space-y-2 rounded-lg bg-white p-4 shadow-sm"><h2 className="font-semibold">{isNew ? "Unit Baru" : `Edit ${u.id}`}</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="inp" placeholder="Nomor unit" disabled={!isNew} value={u.id} onChange={e => setU({ ...u, id: e.target.value })} />
          <select className="inp" value={u.type} onChange={e => setU({ ...u, type: e.target.value as "HT" | "DT" })}><option>HT</option><option>DT</option></select>
          <select className="inp" value={u.area} onChange={e => setU({ ...u, area: Number(e.target.value) as 1 | 2 | 3 })}>{[1, 2, 3].map(a => <option key={a} value={a}>Area {a}</option>)}</select>
          <input className="inp" placeholder="Lokasi" value={u.location} onChange={e => setU({ ...u, location: e.target.value })} /></div>
        {msg && <p className="text-sm font-medium text-red-700">{msg}</p>}
        <div className="flex gap-2"><button className="btn" onClick={() => done(saveUnit(u, isNew))}>Simpan</button><button className="btn bg-gray-600" onClick={() => setOpen(false)}>Tutup</button></div></div>)}
      {open && tab === "driver" && (<div className="space-y-2 rounded-lg bg-white p-4 shadow-sm"><h2 className="font-semibold">{isNew ? "Driver Baru" : `Edit ${d.nik}`}</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="inp" placeholder="NIK" disabled={!isNew} value={d.nik} onChange={e => setD({ ...d, nik: e.target.value })} />
          <input className="inp" placeholder="Nama driver" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} />
          <select className="inp" value={d.area} onChange={e => setD({ ...d, area: Number(e.target.value) as 1 | 2 | 3 })}>{[1, 2, 3].map(a => <option key={a} value={a}>Area {a}</option>)}</select>
          <input className="inp" placeholder="No. HP" value={d.phone ?? ""} onChange={e => setD({ ...d, phone: e.target.value })} /></div>
        {msg && <p className="text-sm font-medium text-red-700">{msg}</p>}
        <div className="flex gap-2"><button className="btn" onClick={() => done(saveDriver(d, isNew))}>Simpan</button><button className="btn bg-gray-600" onClick={() => setOpen(false)}>Tutup</button></div></div>)}
      {tab === "unit" && (<div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm"><Th h={["Nomor Unit", "Jenis", "Area", "Lokasi", "Kondisi", "Data", ""]} />
        <tbody>{units.map(x => (<tr key={x.id} className={`border-t ${x.active === false ? "text-gray-400" : ""}`}><td className="p-2 font-medium">{x.id}</td><td className="p-2">{x.type}</td><td className="p-2">{x.area}</td><td className="p-2">{x.location}</td><td className="p-2">{x.status}</td>
          <td className="p-2">{x.active === false ? "Nonaktif" : "Aktif"}</td><Aksi on={x.active !== false} edit={() => { setIsNew(false); setU(x); setMsg(""); setOpen(true); }} toggle={() => toggleU(x)} /></tr>))}</tbody></table></div>)}
      {tab === "driver" && (<div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm"><Th h={["NIK", "Nama", "Area", "No. HP", "Data", ""]} />
        <tbody>{drivers.map(x => (<tr key={x.nik} className={`border-t ${x.active ? "" : "text-gray-400"}`}><td className="p-2">{x.nik}</td><td className="p-2 font-medium">{x.name}</td><td className="p-2">{x.area}</td><td className="p-2">{x.phone ?? "-"}</td>
          <td className="p-2">{x.active ? "Aktif" : "Nonaktif"}</td><Aksi on={x.active} edit={() => { setIsNew(false); setD(x); setMsg(""); setOpen(true); }} toggle={() => toggleD(x)} /></tr>))}</tbody></table></div>)}
      {(tab === "area" || tab === "shift") && (<div className="rounded-lg bg-white p-4 shadow-sm"><ul className="text-sm">{(tab === "area" ? ["Area 1", "Area 2", "Area 3"] : ["Shift 1", "Shift 2"]).map(x => <li key={x}>• {x} (aktif)</li>)}</ul>
        <p className="mt-2 text-xs text-gray-500">Daftar ini tetap dan belum bisa diubah di versi ini, karena dipakai oleh seluruh modul.</p></div>)}
      {tab === "kegiatan" && (<div className="space-y-2 rounded-lg bg-white p-4 shadow-sm"><div className="flex gap-2"><input className="inp w-72" placeholder="Jenis kegiatan baru" value={act} onChange={e => setAct(e.target.value)} /><button className="btn" onClick={addAct}>Tambah</button></div>
        {msg && <p className="text-sm font-medium text-red-700">{msg}</p>}
        <ul className="text-sm">{acts.map(a => <li key={a} className="flex gap-3">• {a}<button className="text-red-700 underline" onClick={() => saveActivities(acts.filter(x => x !== a))}>Hapus</button></li>)}</ul>
        <p className="text-xs text-gray-500">Daftar ini muncul sebagai saran di kolom kegiatan pada form Request Truk. Kegiatan tetap boleh diketik bebas.</p></div>)}
    </div>
  );
}
