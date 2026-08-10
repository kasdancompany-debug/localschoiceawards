"use client";

import Link from "next/link";
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          background: "#f7f4ef",
          color: "#1a1a1a",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "32rem",
            border: "1px solid #ddd4c6",
            borderRadius: "1rem",
            background: "#fffdf9",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.8rem" }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: "2rem", margin: "0.75rem 0" }}>We hit an unexpected error</h1>
          <p style={{ color: "#5c574f", lineHeight: 1.5 }}>
            The Locals Choice Awards team has been notified when monitoring is enabled. You can try
            again, or return home.
          </p>
          {error.digest ? (
            <p style={{ marginTop: "1rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
              Ref: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "0.5rem",
                padding: "0.65rem 1rem",
                background: "#1a1a1a",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                border: "1px solid #ddd4c6",
                borderRadius: "0.5rem",
                padding: "0.65rem 1rem",
                textDecoration: "none",
                color: "#1a1a1a",
              }}
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
