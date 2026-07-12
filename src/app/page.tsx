"use client";

import { useEffect } from "react";

const POLL_MS = 2000;

/**
 * Public root — deliberately reveals nothing. Every 2 seconds it probes the
 * health endpoint and redirects:
 *   • connected     → a blank page (casual visitors see nothing at all)
 *   • not connected → the minimal /status page (bare status code only)
 */
export default function Home() {
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data?.ok === true) {
          window.location.replace("about:blank");
        } else {
          window.location.replace("/status");
        }
      } catch {
        if (!cancelled) window.location.replace("/status");
      }
    }

    probe();
    const id = setInterval(probe, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return null;
}
