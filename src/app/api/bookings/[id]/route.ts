import { getSupabase } from "@/lib/supabase";
import { json, corsHeaders, isAuthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** Single booking with linked facility + contact — admin only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return json({ ok: false, error: "Missing booking id." }, { status: 400, origin });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      facilities (*),
      contact_persons (*)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[bookings] supabase get error:", error);
    return json({ ok: false, error: "Could not load booking." }, { status: 500, origin });
  }

  if (!data) {
    return json({ ok: false, error: "Booking not found." }, { status: 404, origin });
  }

  return json({ ok: true, booking: data }, { origin });
}
