import { json } from "@/lib/http";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health / connection probe. Intentionally minimal — it exposes only { ok }
 * so casual visitors learn nothing about the service. "Connected" means the
 * API can actually reach its database.
 */
export async function GET() {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true });

    if (error) {
      return json({ ok: false }, { status: 503 });
    }
    return json({ ok: true });
  } catch {
    // Missing env / client failure — treat as not connected.
    return json({ ok: false }, { status: 503 });
  }
}
