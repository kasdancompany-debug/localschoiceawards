"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily:
            '"Manrope", ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
          color: "#1c2430",
          background:
            "radial-gradient(ellipse 80% 50% at 10% -10%, rgba(120, 190, 185, 0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 0%, rgba(140, 160, 200, 0.28), transparent 50%), #f4f8fa",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: "36rem" }}>
            <p
              style={{
                margin: 0,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#5b6b7a",
              }}
            >
              Locals Choice Awards
            </p>
            <h1
              style={{
                margin: "0.85rem 0 0",
                fontFamily: '"Fraunces", Georgia, serif',
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              We hit a temporary snag
            </h1>
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                color: "#4d5b68",
              }}
            >
              This page couldn&apos;t load just now. Try again — your community awards experience
              will be right back.
            </p>
            {error.digest ? (
              <p
                style={{
                  marginTop: "1rem",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "0.75rem",
                  color: "#6b7a88",
                }}
              >
                Ref: {error.digest}
              </p>
            ) : null}
            <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  border: 0,
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1.25rem",
                  background: "#1f3d45",
                  color: "#f7fbfc",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  border: "1px solid #c9d5dc",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1.25rem",
                  textDecoration: "none",
                  color: "#1f3d45",
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.7)",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
