"use client";

import { useEffect, useState } from "react";

const POLL_MS = 2000;

/**
 * Minimal status surface. Shows only a bare code so an operator can tell
 * whether the service is connected, without exposing anything else:
 *   503 → reachable but not connected to the database
 *   000 → service/network unreachable
 * Recovers automatically: once connected again it redirects to a blank page.
 */
export default function Status() {
  const [code, setCode] = useState<string>("…");

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
          setCode(String(res.status || 503));
        }
      } catch {
        if (!cancelled) setCode("000");
      }
    }

    probe();
    const id = setInterval(probe, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <code style={{ fontSize: 13, color: "#8a8f98", letterSpacing: "0.1em" }}>
        {code}
      </code>
    </main>
  );
}
