import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const invalidLogin = "Username atau password salah.";

/**
 * Login berbasis username. Username diubah menjadi email internal `username@msmfleet.com` (spasi menjadi titik: "Fleet Analyst" -> fleet.analyst@msmfleet.com)
 * (akun dibuat di Supabase Authentication dengan email itu). Dua alias lama tetap didukung
 * bila variabel AUTH_FLEET_ANALYST_EMAIL / AUTH_REQUESTER_EMAIL diisi di Vercel.
 */
export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || username.length > 100 || !password || password.length > 1024) {
      return NextResponse.json({ error: invalidLogin }, { status: 401, headers });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: "Konfigurasi login belum lengkap." }, { status: 503, headers });

    const name = username.trim().toLowerCase().replace(/\s+/g, " ");
    const legacy: Record<string, string | undefined> = { "fleet analyst": process.env.AUTH_FLEET_ANALYST_EMAIL, user: process.env.AUTH_REQUESTER_EMAIL };
    const local = name.replace(/ /g, ".");
    const email = legacy[name] ?? (/^[a-z0-9._-]{2,50}$/.test(local) ? `${local}@msmfleet.com` : undefined);
    if (!email) return NextResponse.json({ error: invalidLogin }, { status: 401, headers });

    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return NextResponse.json({ error: invalidLogin }, { status: 401, headers });
    return NextResponse.json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }, { headers });
  } catch {
    return NextResponse.json({ error: "Permintaan login tidak valid." }, { status: 400, headers });
  }
}
