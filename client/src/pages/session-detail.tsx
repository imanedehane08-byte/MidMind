import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Lightbulb, MessageSquare, Check, X } from "lucide-react";
import { getSession, type Session } from "../lib/api";

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 20 }}>
      <div className="skeleton" style={{ height: 18, width: 120 }} />
      <div style={{ display: "grid", gap: 10 }}>
        <div className="skeleton" style={{ height: 30, width: "70%" }} />
        <div className="skeleton" style={{ height: 14, width: "40%" }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />
      ))}
    </div>
  );
}

export default function SessionDetail() {
  const params = useParams();
  const id = Number(params.id || 0);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getSession(id).then(setSession).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: "var(--text)" }}>Session not found</h2>
        <Link href="/history" style={{ color: "#2563eb", fontWeight: 600 }}>
          Return to history
        </Link>
      </div>
    );
  }

  const interactions = [
    ...session.hints.map((h) => ({ ...h, type: "hint" as const })),
    ...session.attempts.map((a) => ({ ...a, type: "attempt" as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 24 }} className="animate-fadeIn">
      <Link href="/history">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Back to History
        </span>
      </Link>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
            {session.question}
          </h1>
          {session.isRevealed && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "var(--green-tint)",
                color: "#16a34a",
                padding: "5px 10px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={13} /> Completed
            </span>
          )}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 20, color: "var(--text-faint)", fontSize: 13, flexWrap: "wrap" }}>
          <span>Started {format(new Date(session.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
          <span>{session.hints.length} hint{session.hints.length !== 1 ? "s" : ""}</span>
          <span>{session.attempts.length} attempt{session.attempts.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        {interactions.length > 1 && (
          <div
            style={{
              position: "absolute",
              left: 19,
              top: 38,
              bottom: 38,
              width: 2,
              background: "var(--border)",
              zIndex: 0,
            }}
          />
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {interactions.map((item, idx) => {
            const isHint = item.type === "hint";
            const isCorrect = !isHint && (item as any).isCorrect;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="animate-fadeIn"
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: 1,
                  animationDelay: `${idx * 0.04}s`,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: isHint ? "var(--blue-tint)" : isCorrect ? "var(--green-tint)" : "var(--purple-tint)",
                    border: `2px solid ${isHint ? "var(--blue-border)" : isCorrect ? "var(--green-border)" : "var(--purple-border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 2,
                  }}
                >
                  {isHint ? (
                    <Lightbulb size={16} color="#2563eb" />
                  ) : (
                    <MessageSquare size={16} color={isCorrect ? "#16a34a" : "#7c3aed"} />
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    background: "var(--bg-card)",
                    border: `1px solid ${isHint ? "var(--blue-border)" : isCorrect ? "var(--green-border)" : "var(--purple-border)"}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: isHint ? "#1d4ed8" : isCorrect ? "#15803d" : "#6d28d9",
                        }}
                      >
                        {isHint ? `Hint ${(item as any).hintNumber}` : `Attempt ${(item as any).attemptNumber}`}
                      </span>
                      {!isHint && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            padding: "2px 7px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isCorrect ? "var(--green-tint)" : "#fef3c7",
                            color: isCorrect ? "#166534" : "#92400e",
                          }}
                        >
                          {isCorrect ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      )}
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                      {format(new Date(item.createdAt), "h:mm a")}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-secondary)" }}>
                    {item.content}
                  </p>

                  {!isHint && (item as any).feedback && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: "1px solid var(--border)",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Feedback: </span>
                      {(item as any).feedback}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {session.isRevealed && session.finalAnswer && (
        <div
          className="animate-fadeIn"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--purple-border)",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "13px 20px",
              background: "var(--blue-tint)",
              fontWeight: 700,
              fontSize: 13,
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid var(--purple-border)",
            }}
          >
            <CheckCircle2 size={16} color="#4f46e5" />
            Final Solution
          </div>
          <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", marginBottom: 6 }}>
                ANSWER
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--text)", fontWeight: 500 }}>
                {session.finalAnswer}
              </p>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", marginBottom: 6 }}>
                EXPLANATION
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)" }}>
                {session.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
