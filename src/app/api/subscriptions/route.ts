import { getSupabase, type Subscription } from "@/lib/supabase";
import { json, corsHeaders, isAuthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** Delete a subscription by id (?id=…). Admin only — protected by the internal key. */
export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return json({ ok: false, error: "Missing subscription id." }, { status: 400, origin });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);

  if (error) {
    console.error("[subscriptions] supabase delete error:", error);
    return json({ ok: false, error: "Could not delete subscription." }, { status: 500, origin });
  }

  return json({ ok: true }, { origin });
}

/** List subscriptions — used by the admin panel. Protected by the internal key. */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const supabase = getSupabase();

  const { data, error, count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[subscriptions] supabase select error:", error);
    return json({ ok: false, error: "Could not load subscriptions." }, { status: 500, origin });
  }

  return json({ ok: true, count: count ?? 0, subscriptions: (data ?? []) as Subscription[] }, { origin });
}
