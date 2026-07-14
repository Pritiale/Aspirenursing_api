import { getSupabase, type ContactPerson, type Facility } from "@/lib/supabase";
import { json, corsHeaders, isAuthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** Single facility with linked bookings + contacts — admin only. */
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
    return json({ ok: false, error: "Missing facility id." }, { status: 400, origin });
  }

  const supabase = getSupabase();

  const { data: facility, error: facilityError } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (facilityError) {
    console.error("[facilities] supabase get error:", facilityError);
    return json({ ok: false, error: "Could not load facility." }, { status: 500, origin });
  }

  if (!facility) {
    return json({ ok: false, error: "Company not found." }, { status: 404, origin });
  }

  const [bookingsRes, contactsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        `
        id,
        booking_number,
        service_title,
        grade,
        shift_start,
        shift_end,
        total_hours,
        total_with_gst,
        status,
        created_at,
        contact_persons ( contact_name, contact_email )
      `,
      )
      .eq("facility_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("contact_persons")
      .select("*")
      .eq("facility_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (bookingsRes.error) {
    console.error("[facilities] bookings list error:", bookingsRes.error);
    return json({ ok: false, error: "Could not load facility bookings." }, { status: 500, origin });
  }

  if (contactsRes.error) {
    console.error("[facilities] contacts list error:", contactsRes.error);
    return json({ ok: false, error: "Could not load facility contacts." }, { status: 500, origin });
  }

  return json(
    {
      ok: true,
      facility: facility as Facility,
      bookings: bookingsRes.data ?? [],
      contactPersons: (contactsRes.data ?? []) as ContactPerson[],
      bookingCount: bookingsRes.data?.length ?? 0,
      contactCount: contactsRes.data?.length ?? 0,
    },
    { origin },
  );
}
