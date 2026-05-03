import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  History as HistoryIcon,
  Layers,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { getSessionStats, listSessions, type Session, type Stats } from "../lib/api";

function StatCard({
  title,
  value,
  loading,
  icon: Icon,
  color,
}: {
  title: string;
  value?: string | number;
  loading: boolean;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div
        style={{
          color: "var(--text-faint)",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 28, width: "60%" }} />
      ) : (
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{value ?? "—"}</div>
      )}
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div className="skeleton" style={{ width: 4, height: 44, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "grid", gap: 8 }}>
        <div className="skeleton" style={{ height: 16, width: "55%" }} />
        <div className="skeleton" style={{ height: 12, width: "35%" }} />
      </div>
    </div>
  );
}

export default function History() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => setError(err.message || "Failed to load sessions"))
      .finally(() => setLoadingSessions(false));
    getSessionStats()
      .then(setStats)
      .catch(() => {/* stats failing is non-critical, page still renders */})
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--blue-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HistoryIcon size={20} color="#2563eb" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            Session History
          </h1>
          <p style={{ margin: 0, color: "var(--text-faint)", fontSize: 13, marginTop: 2 }}>
            Your learning progress over time
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <StatCard title="Total Sessions" value={stats?.totalSessions} loading={loadingStats} icon={Layers} color="#2563eb" />
        <StatCard title="Completion Rate" value={stats ? `${stats.completionRate}%` : undefined} loading={loadingStats} icon={TrendingUp} color="#22c55e" />
        <StatCard title="Avg. Hints" value={stats?.averageHintsUsed} loading={loadingStats} icon={Lightbulb} color="#f59e0b" />
        <StatCard title="Avg. Attempts" value={stats?.averageAttemptsUsed} loading={loadingStats} icon={MessageSquare} color="#8b5cf6" />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Past Sessions</h2>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--red-tint)", color: "#dc2626", border: "1px solid var(--red-border)", fontSize: 14 }}>
            {error}
          </div>
        )}

        {loadingSessions ? (
          <div style={{ display: "grid", gap: 10 }}>
            <SessionSkeleton />
            <SessionSkeleton />
            <SessionSkeleton />
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px dashed var(--border)",
              borderRadius: 16,
              padding: 44,
              textAlign: "center",
            }}
          >
            <BrainCircuit size={44} color="var(--border)" style={{ marginBottom: 14 }} />
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>
              No learning sessions yet
            </p>
            <p style={{ color: "var(--text-muted)", margin: "0 0 18px", fontSize: 14 }}>
              Start your first session to begin tracking your progress.
            </p>
            <Link href="/">
              <span
                style={{
                  display: "inline-block",
                  background: "#2563eb",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Start Learning
              </span>
            </Link>
          </div>
        ) : (
          sessions.map((session) => (
            <Link key={session.id} href={`/session/${session.id}`}>
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#93c5fd";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(37,99,235,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 4,
                    alignSelf: "stretch",
                    borderRadius: 4,
                    background: session.isRevealed
                      ? "linear-gradient(180deg, #22c55e, #16a34a)"
                      : "linear-gradient(180deg, #3b82f6, #2563eb)",
                    flexShrink: 0,
                    minHeight: 44,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 5 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "var(--text)",
                        minWidth: 0,
                      }}
                    >
                      {session.question}
                    </h3>
                    {session.isRevealed && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "var(--green-tint)",
                          color: "#16a34a",
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={11} /> Done
                      </span>
                    )}
                  </div>
                  <div style={{ color: "var(--text-faint)", fontSize: 12 }}>
                    {format(new Date(session.createdAt), "MMM d, yyyy")} &bull;{" "}
                    {session.hintCount} hint{session.hintCount !== 1 ? "s" : ""} &bull;{" "}
                    {session.attemptCount} attempt{session.attemptCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-faint)" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
