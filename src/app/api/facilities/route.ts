import { getSupabase, type Facility } from "@/lib/supabase";
import { json, corsHeaders, isAuthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** List facilities (companies) — admin only (internal key). */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const supabase = getSupabase();

  const { data, error, count } = await supabase
    .from("facilities")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[facilities] supabase list error:", error);
    return json({ ok: false, error: "Could not load facilities." }, { status: 500, origin });
  }

  return json({ ok: true, count: count ?? 0, facilities: (data ?? []) as Facility[] }, { origin });
}
