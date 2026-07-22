import { getSupabase, type Career } from "@/lib/supabase";
import { json, corsHeaders, isAuthorized } from "@/lib/http";
import { serializeCareer, validateCareer, type CareerBody } from "@/lib/careers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** List careers — public sees published only; admin sees all. */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const authorized = isAuthorized(request);

  const supabase = getSupabase();
  let query = supabase
    .from("careers")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (!authorized) {
    query = query.eq("status", "published");
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[careers] supabase select error:", error);
    return json({ ok: false, error: "Could not load careers." }, { status: 500, origin });
  }

  const careers = ((data ?? []) as Career[]).map(serializeCareer);
  return json({ ok: true, count: count ?? careers.length, careers }, { origin });
}

/** Create a career posting — admin only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  let body: CareerBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400, origin });
  }

  const validated = validateCareer(body);
  if ("error" in validated) {
    return json({ ok: false, error: validated.error }, { status: 400, origin });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("careers")
    .insert({ ...validated.data, updated_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) {
    console.error("[careers] supabase insert error:", error);
    return json({ ok: false, error: "Could not create career posting." }, { status: 500, origin });
  }

  return json({ ok: true, career: serializeCareer(data as Career) }, { status: 201, origin });
}
