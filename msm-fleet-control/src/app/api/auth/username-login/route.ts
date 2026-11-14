
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const invalidLogin = "Username atau password salah.";

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };

  try {
    const { username, password } = await req.json();

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      username.length > 100 ||
      !password ||
      password.length > 1024
    ) {
      return NextResponse.json(
        { error: invalidLogin },
        { status: 401, headers }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const accounts: Record<string, string | undefined> = {
      "fleet analyst": process.env.AUTH_FLEET_ANALYST_EMAIL,
      user: process.env.AUTH_REQUESTER_EMAIL,
    };

    if (
      !url ||
      !key ||
      !process.env.AUTH_FLEET_ANALYST_EMAIL ||
      !process.env.AUTH_REQUESTER_EMAIL
    ) {
      return NextResponse.json(
        { error: "Konfigurasi login belum lengkap." },
        { status: 503, headers }
      );
    }

    const normalizedUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    const email = accounts[normalizedUsername];

    if (!email) {
      return NextResponse.json(
        { error: invalidLogin },
        { status: 401, headers }
      );
    }

    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.session) {
      return NextResponse.json(
        { error: invalidLogin },
        { status: 401, headers }
      );
    }

    return NextResponse.json(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Permintaan login tidak valid." },
      { status: 400, headers }
    );
  }
}
