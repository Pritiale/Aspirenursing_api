import { getSupabase, type ContactMessage } from "@/lib/supabase";
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

type ContactBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
};

function validateContact(body: ContactBody) {
  const fullName = (body.fullName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();
  const company = (body.company ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!fullName || fullName.length > 120) {
    return { error: "Please enter your full name." };
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return { error: "Please enter a valid email address." };
  }
  if (phone.length > 40) {
    return { error: "Phone number is too long." };
  }
  if (company.length > 160) {
    return { error: "Company name is too long." };
  }
  if (!message || message.length > 5000) {
    return { error: "Please enter a message." };
  }

  return {
    data: {
      full_name: fullName,
      email,
      phone: phone || null,
      company: company || null,
      message,
    },
  };
}

/** Submit a contact form — proxied from the main site with the internal key. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400, origin });
  }

  const validated = validateContact(body);
  if ("error" in validated) {
    return json({ ok: false, error: validated.error }, { status: 400, origin });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("contact_messages").insert({
    ...validated.data,
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  if (error) {
    console.error("[contact] supabase insert error:", error);
    return json({ ok: false, error: "Could not send your message. Please try again." }, { status: 500, origin });
  }

  return json(
    { ok: true, message: "Thanks for reaching out. Our team will get back to you soon." },
    { origin },
  );
}

/** List contact messages — admin only. */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from("contact_messages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[contact] supabase select error:", error);
    return json({ ok: false, error: "Could not load contact messages." }, { status: 500, origin });
  }

  return json(
    { ok: true, count: count ?? 0, messages: (data ?? []) as ContactMessage[] },
    { origin },
  );
}

/** Delete a contact message by id (?id=…). Admin only. */
export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return json({ ok: false, error: "Missing message id." }, { status: 400, origin });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);

  if (error) {
    console.error("[contact] supabase delete error:", error);
    return json({ ok: false, error: "Could not delete message." }, { status: 500, origin });
  }

  return json({ ok: true }, { origin });
}
