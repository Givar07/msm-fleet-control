"use client";
import { FormEvent, useState } from "react";
import { Truck } from "lucide-react";
export default function Login({ login }: { login: (u: string, p: string) => Promise<string | null> }) {
  const [user, setUser] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr((await login(user, pw)) ?? ""); setBusy(false); };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={go} className="w-full max-w-sm space-y-3 rounded-2xl border bg-white p-4 shadow">
        <div className="rounded-xl bg-navy px-4 py-5 text-center"><Truck className="mx-auto text-gold" size={22} />
          <div className="mt-1 font-bold text-white">MSM Fleet Control</div><div className="text-xs text-gold">Fleet Management System</div></div>
        <label className="block text-sm font-semibold text-gray-600">Username
          <input className="inp mt-1 rounded-full px-4 py-3 font-normal" placeholder="Masukkan username" autoCapitalize="none" autoCorrect="off" value={user} onChange={e => setUser(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-gray-600">Password
          <input className="inp mt-1 rounded-full px-4 py-3 font-normal" type="password" placeholder="Masukkan password" value={pw} onChange={e => setPw(e.target.value)} /></label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn w-full rounded-full py-3" disabled={busy || !user.trim() || !pw}>{busy ? "Memproses…" : "Masuk"}</button>
      </form>
    </div>
  );
}
