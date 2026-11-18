"use client";
import { useStore } from "@/lib/store";
export default function DriverHome() {
  const { ready, userName } = useStore();
  if (!ready) return null;
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h1 className="text-xl font-bold">Kegiatan Saya</h1>
      <p className="mt-2 text-sm text-gray-600">Halo {userName || "Driver"}. Fitur input kegiatan kerja dan ritase harian akan tersedia di tahap berikutnya.</p>
    </div>
  );
}
