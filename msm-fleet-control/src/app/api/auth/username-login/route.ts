
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
        { error: "Username atau password salah." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Layanan login belum dikonfigurasi." },
        { status: 503 }
      );
    }

    const admin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: profile, error: profileError } =
      await admin
        .from("profiles")
        .select("id")
        .ilike("username", username.trim())
        .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(profile.id);

    const email = userData?.user?.email;

    if (userError || !email) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const auth = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } =
      await auth.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.session) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Permintaan login tidak valid." },
      { status: 400 }
    );
  }
}
