import { getSupabase } from "./supabase";

export type CreateBookingInput = {
  serviceId: string;
  serviceTitle: string;
  grade?: number | null;
  start: Date;
  end: Date;
  totalHours?: number;
  subtotal?: number;
  estimatedTotal?: number;
  gstAmount?: number;
  totalWithGst?: number;
  breakApplied: boolean;
  breakAmount?: number;
  breakRate?: number | null;
  overtimeApplies: boolean;
  rateBreakdown?: unknown;
  facilityName: string;
  facilityAddress: string;
  facilityPhone: string;
  contactName: string;
  contactPosition: string;
  contactEmail: string;
  notes?: string;
};

export type CreateBookingResult =
  | { ok: true; id: string; bookingNumber: string }
  | { ok: false; error: string; step?: string };

/** Generate the next BK_0001-style booking number via Postgres sequence. */
async function nextBookingNumber(): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("next_booking_number");
  if (error || !data) {
    console.error("[bookings] next_booking_number RPC error:", error);
    return null;
  }
  return String(data);
}

/**
 * Persist a booking across three tables:
 *   1. facilities
 *   2. contact_persons (linked to facility)
 *   3. bookings (linked to both)
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const supabase = getSupabase();

  // ── 1. Facility ────────────────────────────────────────────────────────────
  const { data: facility, error: facilityError } = await supabase
    .from("facilities")
    .insert({
      facility_name: input.facilityName.slice(0, 200),
      facility_address: input.facilityAddress.slice(0, 400),
      facility_phone: input.facilityPhone.slice(0, 40),
      status: "active",
    })
    .select("id")
    .single();

  if (facilityError || !facility) {
    console.error("[bookings] facility insert error:", facilityError);
    return { ok: false, error: "Could not save facility details.", step: "facility" };
  }

  // ── 2. Contact person ──────────────────────────────────────────────────────
  const { data: contact, error: contactError } = await supabase
    .from("contact_persons")
    .insert({
      contact_name: input.contactName.slice(0, 160),
      contact_position: input.contactPosition.slice(0, 160),
      contact_email: input.contactEmail,
      facility_id: facility.id,
      status: "active",
    })
    .select("id")
    .single();

  if (contactError || !contact) {
    console.error("[bookings] contact_person insert error:", contactError);
    return { ok: false, error: "Could not save contact details.", step: "contact_person" };
  }

  // ── 3. Booking number ──────────────────────────────────────────────────────
  const bookingNumber = await nextBookingNumber();
  if (!bookingNumber) {
    return { ok: false, error: "Could not generate booking number.", step: "booking_number" };
  }

  const rateBreakdownPayload = {
    lines: input.rateBreakdown ?? [],
    subtotal: input.subtotal ?? null,
    breakApplied: input.breakApplied,
    breakAmount: input.breakAmount ?? null,
    breakRate: input.breakRate ?? null,
    overtimeApplies: input.overtimeApplies,
    estimatedTotal: input.estimatedTotal ?? null,
    gstAmount: input.gstAmount ?? null,
    totalWithGst: input.totalWithGst ?? null,
  };

  // ── 4. Booking ─────────────────────────────────────────────────────────────
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      booking_number: bookingNumber,
      service_id: input.serviceId.slice(0, 120),
      service_title: input.serviceTitle.slice(0, 200),
      grade: input.grade ?? null,
      shift_start: input.start.toISOString(),
      shift_end: input.end.toISOString(),
      total_hours:
        typeof input.totalHours === "number" && Number.isFinite(input.totalHours)
          ? input.totalHours
          : null,
      subtotal:
        typeof input.subtotal === "number" && Number.isFinite(input.subtotal)
          ? input.subtotal
          : null,
      estimated_total:
        typeof input.estimatedTotal === "number" && Number.isFinite(input.estimatedTotal)
          ? input.estimatedTotal
          : null,
      gst_amount:
        typeof input.gstAmount === "number" && Number.isFinite(input.gstAmount)
          ? input.gstAmount
          : null,
      total_with_gst:
        typeof input.totalWithGst === "number" && Number.isFinite(input.totalWithGst)
          ? input.totalWithGst
          : null,
      rate_breakdown: rateBreakdownPayload,
      break_applied: input.breakApplied,
      break_amount:
        input.breakApplied &&
        typeof input.breakAmount === "number" &&
        Number.isFinite(input.breakAmount)
          ? input.breakAmount
          : null,
      overtime_applies: input.overtimeApplies,
      notes: input.notes ? input.notes.slice(0, 2000) : null,
      facility_id: facility.id,
      contact_person_id: contact.id,
      status: "pending",
    })
    .select("id, booking_number")
    .single();

  if (bookingError || !booking) {
    console.error("[bookings] booking insert error:", bookingError);
    return { ok: false, error: "Could not save your booking. Please try again.", step: "booking" };
  }

  console.log(`[bookings] created ${booking.booking_number} id=${booking.id}`);

  return {
    ok: true,
    id: booking.id,
    bookingNumber: booking.booking_number,
  };
}
