import { NextResponse } from "next/server";
import { env } from "./env";

/** Build CORS headers for a given request origin. */
export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = env.allowedOrigins();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-internal-key",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

export function json(
  data: unknown,
  init?: { status?: number; origin?: string | null },
): NextResponse {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: init?.origin !== undefined ? corsHeaders(init.origin) : undefined,
  });
}

/** Verify the shared internal API key from the x-internal-key header. */
export function isAuthorized(request: Request): boolean {
  const provided = request.headers.get("x-internal-key")?.trim();
  if (!provided) return false;
  try {
    return provided === env.internalApiKey();
  } catch {
    return false;
  }
}
