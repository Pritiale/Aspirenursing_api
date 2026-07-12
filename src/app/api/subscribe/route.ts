import { getSupabase } from "@/lib/supabase";
import { sendSubscriberWelcome, sendAdminNotification } from "@/lib/email";
import { json, corsHeaders, isAuthorized } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  // Require the shared internal key (calls come from the main proxy / admin).
  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400, origin });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const source = (body.source ?? "homepage").trim().slice(0, 60);

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: "Please enter a valid email address." }, { status: 400, origin });
  }

  const supabase = getSupabase();

  const { error } = await supabase.from("subscriptions").insert({
    email,
    source,
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  // 23505 = unique_violation → this email already exists. Only accept NEW emails.
  if (error?.code === "23505") {
    return json(
      {
        ok: false,
        duplicate: true,
        error: "This email is already subscribed.",
      },
      { status: 409, origin },
    );
  }

  if (error) {
    console.error("[subscribe] supabase insert error:", error);
    return json({ ok: false, error: "Could not save your subscription. Please try again." }, { status: 500, origin });
  }

  // Brand-new subscriber → fire both emails in parallel. Don't fail the request if email breaks.
  try {
    await Promise.allSettled([
      sendSubscriberWelcome(email),
      sendAdminNotification(email),
    ]);
  } catch (e) {
    console.error("[subscribe] email send error:", e);
  }

  return json(
    {
      ok: true,
      message: "Thanks for subscribing! Check your inbox for a confirmation.",
    },
    { origin },
  );
}
