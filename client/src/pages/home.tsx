// Main guided learning page where students ask, receive hints, attempt, and review feedback.
import { useEffect, useRef, useState } from "react";
import { Check, Lightbulb, Flag, Plus, ChevronDown, ChevronUp, X, User } from "lucide-react";
import { getSession, giveUp, requestHint, startSession, submitAttempt, type Attempt, type Hint, type Session } from "../lib/api";

const STEP_READY_TO_ATTEMPT = 3;
const STEP_READY_FOR_HINT   = 4;

const FLOW_STEPS = [
  { n: 1, title: "Get a hint",        desc: "Follow the AI's Socratic nudge"         },
  { n: 2, title: "Write an attempt",  desc: "Share your reasoning, right or wrong"   },
  { n: 3, title: "Earn the solution", desc: "Full explanation unlocked after effort"  },
];

// Shows where the student is in the guided session flow.
function SessionProgress({ session }: { session: Session }) {
  const activeStep = session.isRevealed ? 3
    : session.currentStep === STEP_READY_TO_ATTEMPT ? 2
    : 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {FLOW_STEPS.map(({ n, title, desc }) => {
        const isCurrent = n === activeStep;
        const isDone    = session.isRevealed;

        return (
          <div
            key={n}
            style={{
              background: isDone ? "var(--green-tint)" : isCurrent ? "var(--blue-tint)" : "transparent",
              border: `1px solid ${isDone ? "var(--green-border)" : isCurrent ? "var(--blue-border)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "11px 13px",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: isDone ? "#22c55e" : isCurrent ? "#2563eb" : "var(--bg-hover)",
                color: isDone || isCurrent ? "#fff" : "var(--text-faint)",
                fontWeight: 800,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
                transition: "background 0.3s",
              }}
            >
              {isDone ? <Check size={11} strokeWidth={3} /> : n}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: isDone ? "#15803d" : isCurrent ? "#1d4ed8" : "var(--text-secondary)", marginBottom: 2 }}>
                {title}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>
                {desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Renders one AI-generated hint message in the conversation.
function HintBubble({ hint, isLatest }: { hint: Hint; isLatest: boolean }) {
  return (
    <div className="animate-fadeIn" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: isLatest ? "var(--blue-tint)" : "var(--bg-hover)",
          border: `1px solid ${isLatest ? "var(--blue-border)" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Lightbulb size={15} color={isLatest ? "#2563eb" : "var(--text-faint)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isLatest ? "#2563eb" : "var(--text-faint)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Hint {hint.hintNumber}
        </div>
        <div
          style={{
            background: isLatest ? "var(--blue-tint)" : "var(--bg-hover)",
            border: `1px solid ${isLatest ? "var(--blue-border)" : "var(--border)"}`,
            borderLeft: `3px solid ${isLatest ? "#3b82f6" : "var(--border)"}`,
            borderRadius: "0 16px 16px 16px",
            padding: "14px 18px",
            fontSize: 15,
            lineHeight: 1.75,
            color: "var(--text-secondary)",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {hint.content}
        </div>
      </div>
    </div>
  );
}

// Renders one student attempt and the tutor feedback attached to it.
function AttemptBubble({ attempt }: { attempt: Attempt }) {
  const gaveUp = attempt.isGaveUp;

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "flex-start" }}>
        <div style={{ maxWidth: "78%", minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", marginBottom: 5, textAlign: "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {gaveUp ? "Skipped" : `Attempt ${attempt.attemptNumber}`}
          </div>
          <div
            style={{
              background: gaveUp ? "var(--bg-subtle)" : "#2563eb",
              color: gaveUp ? "var(--text-faint)" : "#fff",
              border: gaveUp ? "1px dashed var(--border)" : "none",
              borderRadius: "16px 4px 16px 16px",
              padding: "12px 16px",
              fontSize: 15,
              lineHeight: 1.65,
              fontStyle: gaveUp ? "italic" : "normal",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {attempt.content}
          </div>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: attempt.isCorrect ? "#22c55e" : gaveUp ? "var(--bg-hover)" : "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 20,
          }}
        >
          {attempt.isCorrect ? (
            <Check size={14} color="#fff" strokeWidth={3} />
          ) : gaveUp ? (
            <Flag size={13} color="var(--text-muted)" />
          ) : (
            <User size={13} color="#fff" />
          )}
        </div>
      </div>

      {attempt.feedback && (
        <div style={{ paddingLeft: 42 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", marginBottom: 5 }}>
            TUTOR
          </div>
          <div
            style={{
              background: attempt.isCorrect ? "var(--green-tint)" : "var(--bg-hover)",
              border: `1px solid ${attempt.isCorrect ? "var(--green-border)" : "var(--border)"}`,
              borderLeft: `3px solid ${attempt.isCorrect ? "#22c55e" : "#64748b"}`,
              borderRadius: "0 14px 14px 14px",
              padding: "12px 16px",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {attempt.isCorrect && (
              <span style={{ color: "#16a34a", fontWeight: 700, marginRight: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Check size={13} strokeWidth={3} /> Correct!
              </span>
            )}
            {attempt.feedback}
          </div>
        </div>
      )}
    </div>
  );
}

// Asks for confirmation before revealing the final answer.
function GiveUpDialog({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        className="animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 28,
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "var(--red-tint)",
              border: "1px solid var(--red-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Flag size={20} color="#dc2626" />
          </div>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
          Show the answer?
        </h2>
        <p style={{ margin: "0 0 22px", color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6 }}>
          We'll reveal the full solution and explanation right now. You won't be able to submit more attempts after this.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Keep trying
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 12,
              border: "none",
              background: "#dc2626",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            {loading ? <><span className="spinner" /> Revealing...</> : "Yes, show answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Shows the final answer and explanation after the session is revealed.
function SolutionPanel({ session }: { session: Session }) {
  return (
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
          background: "linear-gradient(90deg, var(--blue-tint), var(--purple-tint))",
          borderBottom: "1px solid var(--purple-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: 13,
          color: "#4f46e5",
        }}
      >
        <Check size={16} color="#4f46e5" strokeWidth={3} />
        Final Solution
      </div>
      <div style={{ padding: "18px 20px", display: "grid", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", marginBottom: 7 }}>ANSWER</div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "var(--text)", fontWeight: 500, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
            {session.finalAnswer}
          </p>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", marginBottom: 7 }}>EXPLANATION</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "var(--text-muted)", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
            {session.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}


// Coordinates the full guided learning workflow on the main page.
export default function Home() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState("");
  const [attempt, setAttempt] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"start" | "hint" | "attempt" | "giveup" | null>(null);
  const [error, setError] = useState("");
  const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
  const [olderHintsExpanded, setOlderHintsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getSession(sessionId)
      .then(setSession)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.hints.length, session?.attempts.length, session?.isRevealed]);

  // Starts a session by sending the student's question to the backend.
  async function handleStart() {
    if (!question.trim()) return;
    setError("");
    setActionLoading("start");
    try {
      const data = await startSession(question.trim());
      setSessionId(data.id);
      setSession(data);
    } catch (err: any) {
      setError(err.message || "Failed to start session");
    } finally {
      setActionLoading(null);
    }
  }

  // Submits the student's attempt and receives AI feedback.
  async function handleSubmitAttempt() {
    if (!sessionId || !attempt.trim() || !session || session.currentStep < 3 || session.isRevealed) return;
    setError("");
    setActionLoading("attempt");
    try {
      const data = await submitAttempt(sessionId, attempt.trim());
      setSession(data);
      setAttempt("");
    } catch (err: any) {
      setError(err.message || "Failed to submit attempt");
    } finally {
      setActionLoading(null);
    }
  }

  // Requests another hint after feedback has been received.
  async function handleRequestHint() {
    if (!sessionId || !session || session.currentStep < 3 || session.isRevealed) return;
    setError("");
    setActionLoading("hint");
    try {
      const data = await requestHint(sessionId);
      setSession(data);
    } catch (err: any) {
      setError(err.message || "Failed to request hint");
    } finally {
      setActionLoading(null);
    }
  }

  // Reveals the final answer after the backend allows the give-up flow.
  async function handleGiveUp() {
    if (!sessionId) return;
    setShowGiveUpDialog(false);
    setError("");
    setActionLoading("giveup");
    try {
      const data = await giveUp(sessionId);
      setSession(data);
    } catch (err: any) {
      setError(err.message || "Failed to reveal answer");
    } finally {
      setActionLoading(null);
    }
  }

  // Clears local state so the student can begin a new question.
  function handleNewSession() {
    setSessionId(null);
    setSession(null);
    setQuestion("");
    setAttempt("");
    setError("");
    setOlderHintsExpanded(false);
  }

  const conversation: Array<{ type: "hint"; item: Hint } | { type: "attempt"; item: Attempt }> = session
    ? [
        ...session.hints.map((h) => ({ type: "hint" as const, item: h })),
        ...session.attempts.map((a) => ({ type: "attempt" as const, item: a })),
      ].sort((a, b) => new Date(a.item.createdAt).getTime() - new Date(b.item.createdAt).getTime())
    : [];

  const isAttemptPhase  = !!session && session.currentStep === STEP_READY_TO_ATTEMPT && !session.isRevealed;
  const isFeedbackPhase = !!session && session.currentStep === STEP_READY_FOR_HINT   && !session.isRevealed;
  const canGiveUp       = isFeedbackPhase && (session?.realAttemptCount ?? 0) >= 2;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {!session ? (
        <div style={{ display: "grid", gap: 28 }}>
          <div>
            <h1
              style={{
                fontSize: 44,
                lineHeight: 1.08,
                margin: "0 0 14px",
                letterSpacing: "-0.04em",
                fontWeight: 900,
                color: "var(--text)",
              }}
            >
              What would you<br />like to learn?
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-muted)", margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
              Describe a concept or problem. MIDMIND will guide you with hints and feedback — not instant answers.
            </p>
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            }}
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && question.trim().length >= 15) handleStart();
              }}
              placeholder="e.g. How does the TCP handshake work? / What is the time complexity of merge sort?"
              rows={6}
              style={{
                width: "100%",
                resize: "none",
                borderRadius: 14,
                border: "1px solid var(--input-border)",
                padding: "14px 16px",
                fontSize: 16,
                boxSizing: "border-box",
                lineHeight: 1.6,
                fontFamily: "inherit",
                background: "var(--input-bg)",
                color: "var(--text)",
              }}
            />
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              {question.length > 0 && question.length < 15 && (
                <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 500 }}>
                  {15 - question.length} more character{15 - question.length !== 1 ? "s" : ""} needed
                </span>
              )}
              {question.length === 0 && (
                <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Ctrl+Enter to submit</span>
              )}
              {question.length >= 15 && (
                <span style={{ fontSize: 13, color: "var(--text-faint)" }}>{question.length} / 2000</span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={handleStart}
                disabled={question.trim().length < 15 || actionLoading === "start"}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: question.trim().length < 15 || actionLoading === "start" ? "not-allowed" : "pointer",
                  opacity: question.trim().length < 15 || actionLoading === "start" ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "opacity 0.2s",
                }}
              >
                {actionLoading === "start" ? (
                  <><span className="spinner" /> Starting...</>
                ) : (
                  "Start Guided Session →"
                )}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(["Get a hint", "Write your attempt", "Earn the solution"] as const).map((title, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--blue-tint)",
                    border: "1px solid var(--blue-border)",
                    color: "#2563eb",
                    fontWeight: 800,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {i === 0 && "The AI gives you a nudge in the right direction, not the answer."}
                    {i === 1 && "Write what you think, even if you're unsure. Effort counts."}
                    {i === 2 && "Once you've genuinely tried, the full solution is revealed."}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--red-tint)",
                color: "#dc2626",
                border: "1px solid var(--red-border)",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "grid",
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.07em" }}>
                  QUESTION
                </div>
                <div
                  style={{
                    border: "1px solid var(--green-border)",
                    background: "var(--green-tint)",
                    color: "#16a34a",
                    borderRadius: 999,
                    padding: "4px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  Active Learning Mode: On
                </div>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text)",
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {session.question}
              </p>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <SessionProgress session={session} />
            </div>
          </div>

          {error && (
            <div
              className="animate-fadeIn"
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--red-tint)",
                color: "#dc2626",
                border: "1px solid var(--red-border)",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gap: 18 }}>
            {conversation.filter((c) => c.type === "hint").length > 1 && !session.isRevealed && (
              <div>
                <button
                  onClick={() => setOlderHintsExpanded((v) => !v)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: 0,
                    marginBottom: 10,
                  }}
                >
                  {olderHintsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {olderHintsExpanded ? "Collapse" : "Show"} earlier conversation
                </button>
              </div>
            )}

            {conversation.map((entry) => {
              const isLatestHint =
                entry.type === "hint" &&
                (entry.item as Hint).hintNumber === session.hints.length;

              const isOlderHint = entry.type === "hint" && !isLatestHint && session.attempts.length > 0;
              if (isOlderHint && !olderHintsExpanded && !session.isRevealed) return null;

              return entry.type === "hint" ? (
                <HintBubble
                  key={`hint-${entry.item.id}`}
                  hint={entry.item as Hint}
                  isLatest={isLatestHint}
                />
              ) : (
                <AttemptBubble key={`attempt-${entry.item.id}`} attempt={entry.item as Attempt} />
              );
            })}

            {session.isRevealed && <SolutionPanel session={session} />}

            <div ref={bottomRef} />
          </div>

          {isAttemptPhase && (
            <div
              className="animate-fadeIn"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--blue-border)",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.07em", marginBottom: 4 }}>
                YOUR TURN
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Read the hint above and write your best attempt — even a rough one helps.
              </p>
              <textarea
                value={attempt}
                onChange={(e) => setAttempt(e.target.value.slice(0, 1000))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && attempt.trim()) handleSubmitAttempt();
                }}
                placeholder="Explain your reasoning or attempt an answer… (Ctrl+Enter to submit)"
                rows={4}
                style={{
                  width: "100%",
                  resize: "none",
                  borderRadius: 12,
                  border: "1px solid var(--input-border)",
                  padding: "12px 14px",
                  fontSize: 15,
                  boxSizing: "border-box",
                  background: "var(--input-bg)",
                  color: "var(--text)",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 10, gap: 10 }}>
                {attempt.length > 0 && (
                  <span style={{ color: "var(--text-faint)", fontSize: 12 }}>{attempt.length}/1000</span>
                )}
                <button
                  onClick={handleSubmitAttempt}
                  disabled={!attempt.trim() || actionLoading !== null}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    cursor: !attempt.trim() || actionLoading !== null ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    opacity: !attempt.trim() || actionLoading !== null ? 0.55 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  {actionLoading === "attempt" ? <><span className="spinner" /> Submitting...</> : "Submit attempt →"}
                </button>
              </div>
            </div>
          )}

          {isFeedbackPhase && (
            <div
              className="animate-fadeIn"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.07em", marginBottom: 4 }}>
                FEEDBACK RECEIVED
              </div>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Review the feedback above, then get your next hint to continue.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={handleRequestHint}
                  disabled={actionLoading !== null}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "11px 18px",
                    cursor: actionLoading !== null ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    opacity: actionLoading !== null ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                >
                  {actionLoading === "hint"
                    ? <><span className="spinner" /> Loading hint...</>
                    : <><Lightbulb size={14} /> Get next hint →</>}
                </button>

                <button
                  onClick={() => canGiveUp && setShowGiveUpDialog(true)}
                  disabled={!canGiveUp || actionLoading !== null}
                  title={!canGiveUp ? `Available after ${Math.max(0, 2 - (session?.realAttemptCount ?? 0))} more real attempt${2 - (session?.realAttemptCount ?? 0) !== 1 ? "s" : ""}` : undefined}
                  style={{
                    border: `1px solid ${canGiveUp ? "var(--red-border)" : "var(--border)"}`,
                    background: canGiveUp ? "var(--red-tint)" : "var(--bg-subtle)",
                    color: canGiveUp ? "#dc2626" : "var(--text-faint)",
                    borderRadius: 12,
                    padding: "11px 16px",
                    cursor: !canGiveUp || actionLoading !== null ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: actionLoading !== null ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "background 0.2s, border-color 0.2s, color 0.2s",
                  }}
                >
                  {actionLoading === "giveup"
                    ? <><span className="spinner" style={{ borderTopColor: "#dc2626", borderColor: "rgba(220,38,38,0.2)" }} /> Revealing...</>
                    : canGiveUp
                      ? <><Flag size={13} /> Show answer</>
                      : <><Flag size={13} /> Show answer ({Math.max(0, 2 - (session?.realAttemptCount ?? 0))} attempts left)</>}
                </button>
              </div>
            </div>
          )}

          {session.isRevealed && (
            <button
              onClick={handleNewSession}
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                borderRadius: 12,
                padding: "13px 18px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={15} /> Start a new question
            </button>
          )}

          {loading && (
            <div style={{ color: "var(--text-faint)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="spinner spinner-dark" /> Loading...
            </div>
          )}
        </div>
      )}

      {showGiveUpDialog && (
        <GiveUpDialog
          onConfirm={handleGiveUp}
          onCancel={() => setShowGiveUpDialog(false)}
          loading={actionLoading === "giveup"}
        />
      )}
    </div>
  );
}
