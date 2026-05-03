import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wait for AuthContext to receive the user before leaving the login page.
  useEffect(() => {
    if (!loading && user) {
      setLocation("/");
    }
  }, [user, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: 32,
          boxSizing: "border-box",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: 26 }}>
          <div
            style={{
              display: "inline-block",
              padding: "5px 12px",
              borderRadius: 999,
              background: "var(--blue-tint)",
              color: "#2563eb",
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Welcome back
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              color: "var(--text)",
            }}
          >
            Login to MIDMIND
          </h1>
          <p style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6 }}>
            Continue your guided learning sessions and keep building understanding step by step.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "var(--text-secondary)", fontSize: 14 }}>
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1px solid var(--input-border)",
                fontSize: 15,
                boxSizing: "border-box",
                background: "var(--input-bg)",
                color: "var(--text)",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "var(--text-secondary)", fontSize: 14 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1px solid var(--input-border)",
                fontSize: 15,
                boxSizing: "border-box",
                background: "var(--input-bg)",
                color: "var(--text)",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "11px 14px",
                borderRadius: 12,
                background: "var(--red-tint)",
                border: "1px solid var(--red-border)",
                color: "#dc2626",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "13px 18px",
              borderRadius: 12,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? <><span className="spinner" /> Logging in...</> : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          Don't have an account?{" "}
          <Link href="/register">
            <span style={{ color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
