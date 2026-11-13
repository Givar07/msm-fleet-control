"use client";
import { FormEvent, useState } from "react";
export default function Login({ login }: { login: (e: string, p: string) => Promise<string | null> }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr(await login(email.trim(), pw) ?? ""); setBusy(false); };
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <form onSubmit={go} className="w-full max-w-sm space-y-3 rounded-lg bg-white p-6 shadow">
        <div className="text-xl font-bold text-navy">MSM Fleet Control</div><div className="text-sm text-gray-500">Masuk untuk melanjutkan</div>
        <input className="inp" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="inp" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn w-full" disabled={busy || !email || !pw}>{busy ? "Memproses…" : "Masuk"}</button>
      </form>
    </div>
  );
}
