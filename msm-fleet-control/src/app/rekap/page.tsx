"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
const H = ["No", "Department", "Nama User", "No. HP User", "No. Unit", "Nama Driver", "No. HP Driver", "Tujuan", "Kegiatan / Shift"];
export default function Rekap() {
  const { db, area, role, ready } = useStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  if (!ready) return null;
  if (role === "user") return <p>Halaman ini tidak tersedia untuk User / Pemohon.</p>;
  const rows = db.schedules.filter(s => s.date === date && s.status !== "Dibatalkan" && (!area || s.area === area)).sort((a, b) => a.start.localeCompare(b.start));
  const tgl = new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold">Rekap Jadwal Harian</h1>
        <input className="inp w-auto" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <span className="text-sm text-gray-500">Untuk dibagikan: screenshot kotak putih di bawah (Win+Shift+S).</span></div>
      <div className="overflow-x-auto"><div className="min-w-[1000px] bg-white p-4">
        <div className="mb-2"><div className="text-lg font-bold">Jadwal Kendaraan — {area ? `Area ${area}` : "Semua Area"}</div>
          <div className="text-sm text-gray-600">{tgl} · PT Muria Sumba Manis</div></div>
        <table className="w-full border border-gray-300 text-left text-sm">
          <thead><tr className="bg-[#1a5240] text-white">{H.map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{rows.map((s, i) => { const d = db.drivers.find(x => x.nik === s.driverNik); const sh = db.attendance.find(a => a.nik === s.driverNik && a.date === date)?.shift;
            return (<tr key={s.id} className={i % 2 ? "bg-[#f4f6f5]" : "bg-white"}>
              <td className="border-r border-gray-200 p-2">{i + 1}</td><td className="border-r border-gray-200 p-2">{s.department ?? "-"}</td>
              <td className="border-r border-gray-200 p-2">{s.userName ?? "-"}</td><td className="border-r border-gray-200 p-2">{s.userPhone ?? "-"}</td>
              <td className="border-r border-gray-200 p-2 font-medium">{s.unitId}</td><td className="border-r border-gray-200 p-2">{d?.name ?? s.driverNik}</td>
              <td className="border-r border-gray-200 p-2">{d?.phone ?? "-"}</td><td className="border-r border-gray-200 p-2">{s.destination}</td>
              <td className="p-2">{s.activity} / {sh ?? "-"}</td></tr>); })}
            {!rows.length && <tr><td className="p-3 text-gray-500" colSpan={9}>Belum ada jadwal pada tanggal ini.</td></tr>}</tbody></table>
      </div></div>
    </div>
  );
}
