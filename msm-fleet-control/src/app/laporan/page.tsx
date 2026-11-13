"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
type Tab = "fleet" | "absen" | "request" | "tugas" | "kinerja";
const TABS: [Tab, string][] = [["fleet", "Daily Fleet Status"], ["absen", "Daily Driver Attendance"], ["request", "Daily Truck Request"], ["tugas", "Vehicle Assignment"], ["kinerja", "Fleet Performance"]];
const today = () => new Date().toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "0%");
export default function Laporan() {
  const { db, area, role, ready } = useStore();
  const [tab, setTab] = useState<Tab>("fleet"); const [from, setFrom] = useState(today()); const [to, setTo] = useState(today());
  if (!ready) return null;
  if (role === "user") return <p>Halaman ini tidak tersedia untuk User / Pemohon.</p>;
  const inR = (d: string) => d >= from && d <= to; const inA = (a: number) => !area || a === area;
  const drv = (nik: string) => db.drivers.find(d => d.nik === nik);
  const sch = db.schedules.filter(s => inR(s.date) && inA(s.area) && s.status !== "Dibatalkan").sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const att = db.attendance.filter(a => inR(a.date) && inA(drv(a.nik)?.area ?? 0)).sort((a, b) => a.date.localeCompare(b.date));
  const reqs = db.requests.filter(r => inR(r.date) && inA(r.area));
  let h: string[] = []; let rows: string[][] = [];
  if (tab === "fleet") { h = ["Nomor Unit", "Jenis", "Area", "Lokasi", "Kondisi", "Jadwal (periode)", "Keterangan", "Update Terakhir"];
    rows = db.units.filter(u => inA(u.area)).map(u => [u.id, u.type, String(u.area), u.location, u.status, String(sch.filter(s => s.unitId === u.id).length), u.note || "-", u.updatedAt.slice(0, 16).replace("T", " ")]); }
  if (tab === "absen") { h = ["Tanggal", "NIK", "Nama Driver", "Area", "Shift", "Jam Masuk", "Jam Pulang", "Status", "Keterangan"];
    rows = att.map(a => [a.date, a.nik, drv(a.nik)?.name ?? "-", String(drv(a.nik)?.area ?? "-"), a.shift, a.in ?? "-", a.out ?? "-", a.status, a.note || "-"]); }
  if (tab === "request") { h = ["Request ID", "Tgl Request", "Pemohon", "Department", "Area", "Jenis", "Diminta", "Disetujui", "Ditugaskan", "Sisa", "Tgl Pakai", "Jam", "Tujuan", "Kegiatan", "Status"];
    rows = reqs.map(r => [r.id, r.createdAt.slice(0, 10), r.requester, r.department ?? "-", String(r.area), r.type, String(r.qty), String(r.approved), String(r.assigned), String(r.qty - r.assigned), r.date, `${r.start}-${r.end}`, r.destination, r.activity, r.status]); }
  if (tab === "tugas") { h = ["Tanggal", "Unit", "Jenis", "Driver", "No. HP Driver", "Area", "Tujuan", "Kegiatan", "Mulai", "Selesai", "Status", "Request"];
    rows = sch.map(s => [s.date, s.unitId, db.units.find(u => u.id === s.unitId)?.type ?? "-", drv(s.driverNik)?.name ?? s.driverNik, drv(s.driverNik)?.phone ?? "-", String(s.area), s.destination, s.activity, s.start, s.end, s.status, s.requestId ?? "-"]); }
  if (tab === "kinerja") { h = ["Area", "Total Unit", "Operational", "Standby", "Breakdown", "% Operational", "% Kehadiran Driver", "Jumlah Request", "Unit Diminta", "Unit Ditugaskan", "% Terpenuhi", "Jadwal"];
    rows = [1, 2, 3].filter(inA).map(a => { const u = db.units.filter(x => x.area === a); const n = (s: string) => u.filter(x => x.status === s).length;
      const at = att.filter(x => drv(x.nik)?.area === a); const rq = reqs.filter(r => r.area === a);
      const qty = rq.reduce((t, r) => t + r.qty, 0); const asg = rq.reduce((t, r) => t + r.assigned, 0);
      return [`Area ${a}`, String(u.length), String(n("Operational")), String(n("Standby")), String(n("Breakdown")), pct(n("Operational"), u.length), pct(at.filter(x => x.status === "Hadir").length, at.length), String(rq.length), String(qty), String(asg), pct(asg, qty), String(sch.filter(s => s.area === a).length)]; }); }
  const download = () => {
    const csv = "\uFEFFsep=;\r\n" + [h, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${tab}_${from}_${to}.csv`; a.click(); };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Laporan</h1>
      <div className="flex flex-wrap gap-2">{TABS.map(([k, l]) => <button key={k} className={`rounded-md px-3 py-2 text-sm ${tab === k ? "bg-gold text-navy" : "bg-white"}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Dari <input className="inp w-auto" type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label className="text-sm">Sampai <input className="inp w-auto" type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <span className="text-sm text-gray-500">{area ? `Area ${area}` : "Semua Area"} · {rows.length} baris</span>
        <button className="btn ml-auto" onClick={download} disabled={!rows.length}>Unduh CSV (Excel)</button></div>
      {tab === "fleet" && <p className="text-xs text-gray-500">Kondisi unit adalah status terbaru saat ini. Kolom jadwal menghitung penugasan pada periode yang dipilih.</p>}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm"><table className="w-full text-left text-sm">
        <thead className="bg-navy text-white"><tr>{h.map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="p-2">{c}</td>)}</tr>)}
          {!rows.length && <tr><td className="p-3 text-gray-500" colSpan={h.length}>Tidak ada data pada periode ini.</td></tr>}</tbody></table></div>
    </div>
  );
}
