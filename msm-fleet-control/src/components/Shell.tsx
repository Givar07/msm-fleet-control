"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Truck, ClipboardList, Activity, UserCheck, CalendarDays, FileText, Database, FileSpreadsheet, Menu } from "lucide-react";
import { useState, ReactNode } from "react";
import { useStore } from "@/lib/store";
import { AREAS, Role } from "@/lib/types";
import Login from "./Login";
const ROLES: Record<Role, string> = { super_admin: "Fleet Super Admin", admin_area: "Admin Area", user: "User / Pemohon", management: "Management" };
const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin_area", "management"] },
  { href: "/monitoring", label: "Monitoring HT & DT", icon: Activity, roles: ["super_admin", "admin_area", "management"] },
  { href: "/absensi", label: "Absensi Driver", icon: UserCheck, roles: ["super_admin", "admin_area", "management"] },
  { href: "/jadwal", label: "Jadwal Kendaraan", icon: CalendarDays, roles: ["super_admin", "admin_area", "management"] },
  { href: "/rekap", label: "Rekap Harian", icon: FileText, roles: ["super_admin", "admin_area", "management"] },
  { href: "/master", label: "Master Data", icon: Database, roles: ["super_admin"] },
  { href: "/laporan", label: "Laporan", icon: FileSpreadsheet, roles: ["super_admin", "admin_area", "management"] },
  { href: "/admin", label: "Admin Request", icon: ClipboardList, roles: ["super_admin", "admin_area", "management"] },
  { href: "/request", label: "Request Truk", icon: Truck, roles: ["super_admin", "user"] },
];
export default function Shell({ children }: { children: ReactNode }) {
  const { role, setRole, area, setArea, reset, cloud, authReady, session, profileMissing, ready, userName, login, logout } = useStore(); const p = usePathname(); const [open, setOpen] = useState(false);
  if (cloud && !authReady) return <p className="p-6">Memuat…</p>;
  if (cloud && !session) return <Login login={login} />;
  if (cloud && profileMissing) return <div className="p-6"><p>Akun Anda belum diberi peran. Hubungi Fleet Super Admin.</p><button className="btn mt-3" onClick={logout}>Keluar</button></div>;
  if (cloud && !ready) return <p className="p-6">Memuat data…</p>;
  return (
    <div className="flex min-h-screen">
      <aside className={`${open ? "block" : "hidden"} fixed inset-y-0 z-20 w-60 bg-navy p-4 text-white md:static md:block`}>
        <div className="mb-6 text-lg font-bold text-gold">MSM Fleet Control</div>
        <nav className="space-y-1">{NAV.filter(n => n.roles.includes(role)).map(n => (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${p === n.href ? "bg-gold text-navy" : "hover:bg-white/10"}`}>
            <n.icon size={16} />{n.label}</Link>))}</nav>
      </aside>
      <div className="flex-1">
        <header className="flex flex-wrap items-center gap-2 border-b bg-white p-3">
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
          {cloud ? <span className="text-sm font-medium">{userName} · {ROLES[role]}</span> : <select className="inp w-auto" value={role} onChange={e => setRole(e.target.value as Role)}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
          <select className="inp w-auto" value={area} disabled={cloud && role === "admin_area"} onChange={e => setArea(Number(e.target.value) as 0 | 1 | 2 | 3)}>
            <option value={0}>Semua Area</option>{([1, 2, 3] as const).map(a => <option key={a} value={a}>{AREAS[a]}</option>)}</select>
          <div className="ml-auto flex gap-2">{(!cloud || role === "super_admin") && <button className="btn" onClick={() => confirm(cloud ? "Ini MENGHAPUS SEMUA data online dan menggantinya dengan data demo. Lanjutkan?" : "Reset semua data demo?") && reset()}>Reset Data Demo</button>}
            {cloud && <button className="btn bg-gray-600" onClick={logout}>Keluar</button>}</div>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
