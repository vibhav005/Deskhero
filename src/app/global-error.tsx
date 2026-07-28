"use client";

import { AlertTriangle } from "lucide-react";

// Root layout replacement for catastrophic errors — can't rely on globals.css'
// Tailwind classes resolving reliably here, so this stays minimal and inline.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#110f0d",
          color: "#f5f3f0",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", textAlign: "center" }}>
          <AlertTriangle size={40} color="#f06b42" aria-hidden />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ maxWidth: 320, fontSize: "0.875rem", opacity: 0.75, margin: 0 }}>
            DeskHero hit an unexpected error. Try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "0.5rem",
              borderRadius: "0.75rem",
              padding: "0.625rem 1.25rem",
              background: "#f2b62c",
              color: "#251d0e",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
