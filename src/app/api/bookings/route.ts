import { createBooking } from "@/lib/booking-create";
import { resolveApiGrade } from "@/lib/booking-grades";
import { getSupabase } from "@/lib/supabase";
import { json, corsHeaders, isAuthorized } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BookingBody = {
  serviceId?: string;
  serviceTitle?: string;
  grade?: number | null;
  start?: string;
  end?: string;
  totalHours?: number;
  subtotal?: number;
  estimatedTotal?: number;
  gstAmount?: number;
  totalWithGst?: number;
  breakApplied?: boolean;
  breakAmount?: number;
  breakRate?: number | null;
  overtimeApplies?: boolean;
  rateBreakdown?: unknown;
  facilityName?: string;
  address?: string;
  facilityPhone?: string;
  contactName?: string;
  contactPosition?: string;
  contactEmail?: string;
  notes?: string;
};

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

/** List bookings — admin only (internal key). */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const supabase = getSupabase();

  const { data, error, count } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_number,
      service_id,
      service_title,
      grade,
      facility_id,
      contact_person_id,
      shift_start,
      shift_end,
      total_hours,
      estimated_total,
      gst_amount,
      total_with_gst,
      status,
      notes,
      created_at,
      facilities ( facility_name, facility_address, facility_phone ),
      contact_persons ( contact_name, contact_email, contact_position )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[bookings] supabase list error:", error);
    return json({ ok: false, error: "Could not load bookings." }, { status: 500, origin });
  }

  return json({ ok: true, count: count ?? 0, bookings: data ?? [] }, { origin });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  let body: BookingBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400, origin });
  }

  const serviceId = (body.serviceId ?? "").trim();
  const serviceTitle = (body.serviceTitle ?? "").trim();
  const facilityName = (body.facilityName ?? "").trim();
  const facilityAddress = (body.address ?? "").trim();
  const facilityPhone = (body.facilityPhone ?? "").trim();
  const contactName = (body.contactName ?? "").trim();
  const contactPosition = (body.contactPosition ?? "").trim();
  const contactEmail = (body.contactEmail ?? "").trim().toLowerCase();
  const notes = (body.notes ?? "").trim();

  const start = new Date(body.start ?? "");
  const end = new Date(body.end ?? "");

  const missing =
    !serviceId ||
    !serviceTitle ||
    !facilityName ||
    !facilityAddress ||
    !facilityPhone ||
    !contactName ||
    !contactPosition ||
    !contactEmail;

  if (missing) {
    return json({ ok: false, error: "Missing required booking fields." }, { status: 400, origin });
  }

  if (!EMAIL_RE.test(contactEmail) || contactEmail.length > 254) {
    return json({ ok: false, error: "A valid contact email is required." }, { status: 400, origin });
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return json({ ok: false, error: "Invalid shift start/end." }, { status: 400, origin });
  }

  const gradeResult = resolveApiGrade(serviceId, body.grade);
  if (!gradeResult.ok) {
    return json({ ok: false, error: gradeResult.error }, { status: 400, origin });
  }

  const result = await createBooking({
    serviceId,
    serviceTitle,
    grade: gradeResult.grade,
    start,
    end,
    totalHours: body.totalHours,
    subtotal: body.subtotal,
    estimatedTotal: body.estimatedTotal,
    gstAmount: body.gstAmount,
    totalWithGst: body.totalWithGst,
    breakApplied: Boolean(body.breakApplied),
    breakAmount: body.breakAmount,
    breakRate: body.breakRate,
    overtimeApplies: Boolean(body.overtimeApplies),
    rateBreakdown: body.rateBreakdown,
    facilityName,
    facilityAddress,
    facilityPhone,
    contactName,
    contactPosition,
    contactEmail,
    notes: notes || undefined,
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, { status: 500, origin });
  }

  return json(
    {
      ok: true,
      id: result.id,
      bookingNumber: result.bookingNumber,
      message: "Your booking request has been received.",
    },
    { origin },
  );
}
