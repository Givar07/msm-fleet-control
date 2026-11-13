import { createClient, SupabaseClient } from "@supabase/supabase-js";
export type { SupabaseClient };
let c: SupabaseClient | null | undefined;
/** null = mode demo (tanpa database online). Aktif jika dua variabel lingkungan di bawah diisi. */
export function getSupabase(): SupabaseClient | null {
  if (c !== undefined) return c;
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  c = u && k ? createClient(u, k) : null; return c;
}
