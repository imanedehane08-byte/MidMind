// Admin dashboard page for viewing users, sessions, and global learning stats.
import { useEffect, useState } from "react";
import { ShieldCheck, Users, Layers, CheckCircle2, TrendingUp, Lightbulb, MessageSquare, type LucideIcon } from "lucide-react";
import { getAdminSessions, getAdminStats, getAdminUsers, type AdminStats, type Session, type User } from "../lib/api";

// Displays one admin statistic with an icon and loading state.
function StatCard({
  label,
  value,
  loading,
  icon: Icon,
  color,
}: {
  label: string;
  value?: string | number;
  loading: boolean;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}1a`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div style={{ color: "var(--text-faint)", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 30, width: "50%" }} />
      ) : (
        <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text)" }}>{value ?? "—"}</div>
      )}
    </div>
  );
}

// Shows placeholder rows while admin data is loading.
function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
      ))}
    </div>
  );
}

// Loads admin data and renders users, sessions, and statistics.
export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminUsers(), getAdminSessions(), getAdminStats()])
      .then(([usersData, sessionsData, statsData]) => {
        setUsers(usersData);
        setSessions([...sessionsData].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setStats(statsData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }} className="animate-fadeIn">
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: 14,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(37,99,235,0.25)",
          }}
        >
          <ShieldCheck size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: "-0.03em", fontWeight: 800, color: "var(--text)" }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "var(--text-faint)", fontSize: 14, margin: "3px 0 0" }}>
            Monitor users, sessions, and guided learning activity.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Users"        value={stats?.totalUsers}                                   loading={loading} icon={Users}        color="#2563eb" />
        <StatCard label="Total Sessions"     value={stats?.totalSessions}                                loading={loading} icon={Layers}       color="#8b5cf6" />
        <StatCard label="Revealed Sessions"  value={stats?.revealedSessions}                             loading={loading} icon={CheckCircle2} color="#22c55e" />
        <StatCard label="Completion Rate"    value={stats ? `${stats.completionRate}%` : undefined}      loading={loading} icon={TrendingUp}   color="#f59e0b" />
        <StatCard label="Avg. Hints Used"    value={stats?.averageHintsUsed}                             loading={loading} icon={Lightbulb}    color="#06b6d4" />
        <StatCard label="Avg. Attempts Used" value={stats?.averageAttemptsUsed}                          loading={loading} icon={MessageSquare} color="#ec4899" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 22, alignItems: "start" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 22 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Users</h2>
          {loading ? (
            <TableSkeleton rows={4} />
          ) : users.length === 0 ? (
            <p style={{ color: "var(--text-faint)", fontSize: 14, textAlign: "center" }}>No users yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "var(--bg-subtle)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: u.role === "admin"
                        ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                        : "var(--bg-hover)",
                      color: u.role === "admin" ? "#fff" : "var(--text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{u.name}</div>
                    <div style={{ color: "var(--text-faint)", marginTop: 2, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.email}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px", borderRadius: 999,
                      background: u.role === "admin" ? "#dbeafe" : "var(--bg-hover)",
                      color: u.role === "admin" ? "#1d4ed8" : "var(--text-muted)",
                      fontSize: 11, fontWeight: 700, textTransform: "capitalize", flexShrink: 0,
                    }}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 22 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Sessions</h2>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : sessions.length === 0 ? (
            <p style={{ color: "var(--text-faint)", fontSize: 14, textAlign: "center" }}>No sessions yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: "var(--bg-subtle)",
                    borderLeft: `3px solid ${s.isRevealed ? "#22c55e" : "#3b82f6"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      #{s.id} — {s.question}
                    </div>
                    <span
                      style={{
                        padding: "2px 7px", borderRadius: 999,
                        background: s.isRevealed ? "var(--green-tint)" : "var(--blue-tint)",
                        color: s.isRevealed ? "#166534" : "#1d4ed8",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {s.isRevealed ? "Revealed" : "Active"}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-faint)", fontSize: 12 }}>
                    {s.hintCount} hints &bull; {s.attemptCount} attempts &bull;{" "}
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
