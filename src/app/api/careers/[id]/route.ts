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

/** Get a single career — public sees published only; admin sees all. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  const { id } = await params;
  const authorized = isAuthorized(request);

  const supabase = getSupabase();
  let query = supabase.from("careers").select("*").eq("id", id).maybeSingle();

  const { data, error } = await query;

  if (error) {
    console.error("[careers] supabase select error:", error);
    return json({ ok: false, error: "Could not load career posting." }, { status: 500, origin });
  }

  if (!data) {
    return json({ ok: false, error: "Career posting not found." }, { status: 404, origin });
  }

  if (!authorized && data.status !== "published") {
    return json({ ok: false, error: "Career posting not found." }, { status: 404, origin });
  }

  return json({ ok: true, career: serializeCareer(data as Career) }, { origin });
}

/** Update a career posting — admin only. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const { id } = await params;

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
    .update({ ...validated.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[careers] supabase update error:", error);
    return json({ ok: false, error: "Could not update career posting." }, { status: 500, origin });
  }

  if (!data) {
    return json({ ok: false, error: "Career posting not found." }, { status: 404, origin });
  }

  return json({ ok: true, career: serializeCareer(data as Career) }, { origin });
}

/** Delete a career posting — admin only. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const { id } = await params;
  const supabase = getSupabase();
  const { error } = await supabase.from("careers").delete().eq("id", id);

  if (error) {
    console.error("[careers] supabase delete error:", error);
    return json({ ok: false, error: "Could not delete career posting." }, { status: 500, origin });
  }

  return json({ ok: true }, { origin });
}
