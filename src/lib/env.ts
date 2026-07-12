/**
 * Centralised, validated environment access for the API project.
 * All values are server-side only (never NEXT_PUBLIC_*).
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    // Thrown lazily at call-time so the build doesn't fail without env vars.
    throw new Error(`[api] Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const env = {
  supabaseUrl: () => required("SUPABASE_URL", process.env.SUPABASE_URL),
  supabaseServiceRoleKey: () =>
    required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),

  sendgridApiKey: () => required("SENDGRID_API_KEY", process.env.SENDGRID_API_KEY),
  sendgridFromEmail: () => required("SENDGRID_FROM_EMAIL", process.env.SENDGRID_FROM_EMAIL),
  sendgridFromName: () => (process.env.SENDGRID_FROM_NAME || "Aspire Nursing Agency").trim(),
  adminNotifyEmail: () => required("ADMIN_NOTIFY_EMAIL", process.env.ADMIN_NOTIFY_EMAIL),

  // Optional SendGrid Dynamic Template IDs — empty string means "use inline HTML".
  sendgridWelcomeTemplateId: () => (process.env.SENDGRID_TEMPLATE_WELCOME || "").trim(),
  sendgridAdminTemplateId: () => (process.env.SENDGRID_TEMPLATE_ADMIN || "").trim(),

  internalApiKey: () => required("INTERNAL_API_KEY", process.env.INTERNAL_API_KEY),

  allowedOrigins: (): string[] =>
    (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
};
