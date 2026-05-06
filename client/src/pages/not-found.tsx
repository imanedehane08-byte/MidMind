// Fallback page shown when the user visits an unknown route.
import { Link } from "wouter";

// Renders a friendly 404 page with a link back to the app.
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "36px 40px",
          maxWidth: 460,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          404
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
          Page not found
        </h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          This route doesn't exist. Head back to start learning.
        </p>
        <Link href="/">
          <span
            style={{
              display: "inline-block",
              background: "#2563eb",
              color: "#fff",
              padding: "11px 22px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Go home
          </span>
        </Link>
      </div>
    </div>
  );
}
