import { Router } from "express";
import { sessionDb } from "../data/db.js";
import {
  generateFirstHint,
  generateNextHint,
  evaluateAttempt,
  generateFinalSolution,
  isQuotaError,
} from "../services/ai.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const MAX_GUIDED_INTERACTIONS = Number(process.env.MAX_GUIDED_INTERACTIONS) || 5;
const MIN_REAL_ATTEMPTS_BEFORE_GIVEUP = Number(process.env.MIN_REAL_ATTEMPTS_BEFORE_GIVEUP) || 2;

const SESSION_STEP = Object.freeze({
  READY_TO_ATTEMPT: 3,
  READY_FOR_HINT: 4,
  REVEALED: 5,
});

const GIVE_UP_PATTERNS = [
  /^i(\s+don'?t|\s+do\s+not)\s+know/i,
  /^(idk|idek)\b/i,
  /^i\s+(have\s+)?no\s+(idea|clue)/i,
  /^(i\s+)?(give\s+up|giving\s+up)/i,
  /^i('m|\s+am)\s+(stuck|lost|confused)/i,
];

const BYPASS_WORDS = new Set([
  "yes", "no", "ok", "okay", "sure", "maybe", "nothing",
  "idk", "lol", "hmm", "uh", "um", "ah", "oh",
  "yep", "nope", "nah", "dunno", "test", "hello", "hi",
  "asdf", "qwerty", "abc", "foo", "bar", "blah", "random",
  "help", "please", "thanks", "no idea", "don't know",
]);

const KEYBOARD_ROWS = [
  new Set("qwertyuiop"),
  new Set("asdfghjkl"),
  new Set("zxcvbnm"),
];

function isGibberish(text) {
  const letters = text.replace(/[^a-z]/gi, "");
  if (letters.length < 5) return false;

  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  return vowels / letters.length < 0.12;
}

// Checks for empty-looking answers so students cannot skip the learning step.
function isBypassAttempt(text) {
  const t = text.trim().toLowerCase();
  if (t.replace(/\s+/g, "").length < 5) return true;

  const bare = t.replace(/[^a-z0-9\s]/g, "").trim();
  if (BYPASS_WORDS.has(bare)) return true;

  if (/^(.)\1{3,}$/.test(t)) return true;

  const noSpaces = t.replace(/\s/g, "");
  if (noSpaces.length >= 5 && KEYBOARD_ROWS.some((row) => [...noSpaces].every((c) => row.has(c)))) {
    return true;
  }

  if (isGibberish(t)) return true;
  if (/^[^a-z]+$/i.test(t)) return true;

  return false;
}

function isGivingUp(text) {
  return GIVE_UP_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

function now() {
  return new Date().toISOString();
}

// Stores plain text only. React already escapes output, but this keeps saved data clean too.
function sanitizeUserText(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function aiErrorMessage(err) {
  return isQuotaError(err)
    ? "AI quota exceeded. Please try again later."
    : "AI service is temporarily unavailable. Please try again.";
}

function canAccess(req, session) {
  return req.user.role === "admin" || session.userId === req.user.id;
}

router.get("/sessions", requireAuth, (req, res) => {
  const sessions = req.user.role === "admin"
    ? sessionDb.findAll()
    : sessionDb.findByUserId(req.user.id);
  res.json(sessions);
});

router.get("/sessions/stats", requireAuth, (req, res) => {
  const row = req.user.role === "admin"
    ? sessionDb.stats()
    : sessionDb.stats(req.user.id);

  const total = row.total || 0;
  const revealed = row.revealed || 0;

  res.json({
    totalSessions: total,
    revealedSessions: revealed,
    averageHintsUsed: Math.round((row.avg_hints || 0) * 10) / 10,
    averageAttemptsUsed: Math.round((row.avg_attempts || 0) * 10) / 10,
    completionRate: total ? Math.round((revealed / total) * 10000) / 100 : 0,
  });
});

router.post("/sessions", requireAuth, async (req, res) => {
  const question = sanitizeUserText(req.body?.question);

  if (!question) return res.status(400).send("Question is required");
  if (question.length < 15) return res.status(400).send("Please describe your question in more detail (at least 15 characters).");
  if (question.length > 2000) return res.status(400).send("Question must be 2000 characters or fewer");

  let firstHint;
  try {
    firstHint = await generateFirstHint(question);
  } catch (err) {
    console.error("[sessions] generateFirstHint error:", err?.status, err?.message);
    return res.status(502).send(aiErrorMessage(err));
  }

  const createdAt = now();
  const session = sessionDb.create({
    userId: req.user.id,
    question,
    currentStep: SESSION_STEP.READY_TO_ATTEMPT,
    hintCount: 1,
    attemptCount: 0,
    realAttemptCount: 0,
    createdAt,
  });

  sessionDb.addHint({ sessionId: session.id, content: firstHint, hintNumber: 1, createdAt });
  return res.status(201).json(sessionDb.findById(session.id));
});

router.get("/sessions/:id", requireAuth, (req, res) => {
  const session = sessionDb.findById(Number(req.params.id));

  if (!session) return res.status(404).send("Session not found");
  if (!canAccess(req, session)) return res.status(403).send("Forbidden");

  return res.json(session);
});

router.post("/sessions/:id/attempt", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const attemptText = sanitizeUserText(req.body?.attempt);
  const session = sessionDb.findById(id);

  if (!session) return res.status(404).send("Session not found");
  if (!canAccess(req, session)) return res.status(403).send("Forbidden");
  if (!attemptText) return res.status(400).send("Attempt is required");
  if (attemptText.length > 1000) return res.status(400).send("Attempt must be 1000 characters or fewer");
  if (session.isRevealed) return res.json(session);
  if (session.currentStep !== SESSION_STEP.READY_TO_ATTEMPT) {
    return res.status(400).send("Get your next hint before submitting another attempt");
  }

  // This path gives feedback but does not count as a real learning attempt.
  if (isBypassAttempt(attemptText)) {
    const newAttemptCount = session.attemptCount + 1;
    const feedback =
      "That doesn't look like a real attempt. Try to engage with the question - " +
      "even a rough or uncertain answer is fine. Re-read the hint and write what you think, " +
      "even if you're not sure. What does the hint suggest to you?";

    sessionDb.addAttempt({
      sessionId: id,
      content: attemptText,
      feedback,
      attemptNumber: newAttemptCount,
      isCorrect: false,
      isGaveUp: true,
      createdAt: now(),
    });
    sessionDb.update(id, { attemptCount: newAttemptCount, currentStep: SESSION_STEP.READY_FOR_HINT });
    return res.json(sessionDb.findById(id));
  }

  if (isGivingUp(attemptText)) {
    const priorGiveUps = session.attempts.filter((attempt) => attempt.isGaveUp).length;
    const encouragements = [
      "You don't need to be right — just give it a shot. What does the hint suggest to you?",
      "Even a rough guess helps. Look at the hint again and write what comes to mind.",
      "You've said you're stuck a few times now. Try writing anything you think, even if it's wrong. Or use the 'Show answer' button if you're truly stuck.",
    ];
    const feedback = encouragements[Math.min(priorGiveUps, encouragements.length - 1)];
    const newAttemptCount = session.attemptCount + 1;

    sessionDb.addAttempt({
      sessionId: id,
      content: attemptText,
      feedback,
      attemptNumber: newAttemptCount,
      isCorrect: false,
      isGaveUp: true,
      createdAt: now(),
    });

    sessionDb.update(id, { attemptCount: newAttemptCount, currentStep: SESSION_STEP.READY_FOR_HINT });
    return res.json(sessionDb.findById(id));
  }

  const attemptNumber = session.attemptCount + 1;

  let feedback, isCorrect;
  try {
    ({ feedback, isCorrect } = await evaluateAttempt({
      question: session.question,
      attempt: attemptText,
      hints: session.hints.map((hint) => hint.content),
      previousAttempts: session.attempts.map((attempt) => ({ content: attempt.content, feedback: attempt.feedback })),
      attemptNumber,
    }));
  } catch (err) {
    console.error("[sessions] evaluateAttempt error:", err?.status, err?.message);
    return res.status(502).send(aiErrorMessage(err));
  }

  sessionDb.addAttempt({
    sessionId: id,
    content: attemptText,
    feedback,
    attemptNumber,
    isCorrect,
    isGaveUp: false,
    createdAt: now(),
  });

  const newRealAttemptCount = session.realAttemptCount + 1;
  const shouldReveal = newRealAttemptCount >= MAX_GUIDED_INTERACTIONS || isCorrect;
  const updates = {
    attemptCount: attemptNumber,
    realAttemptCount: newRealAttemptCount,
    currentStep: SESSION_STEP.READY_FOR_HINT,
  };

  if (shouldReveal) {
    try {
      const { finalAnswer, explanation } = await generateFinalSolution({
        question: session.question,
        hints: session.hints.map((hint) => hint.content),
        attempts: [...session.attempts, { content: attemptText, feedback }]
          .map((attempt) => ({ content: attempt.content, feedback: attempt.feedback })),
        studentSolvedIt: isCorrect,
      });
      Object.assign(updates, { isRevealed: true, finalAnswer, explanation });
    } catch (err) {
      console.error("[sessions] generateFinalSolution error:", err?.status, err?.message);
      Object.assign(updates, {
        isRevealed: true,
        finalAnswer: isCorrect ? attemptText : "Solution could not be generated.",
        explanation: feedback || "AI service is temporarily unavailable.",
      });
    }
  }

  sessionDb.update(id, updates);
  return res.json(sessionDb.findById(id));
});

router.post("/sessions/:id/hint", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const session = sessionDb.findById(id);

  if (!session) return res.status(404).send("Session not found");
  if (!canAccess(req, session)) return res.status(403).send("Forbidden");
  if (session.isRevealed) return res.json(session);

  if (session.currentStep !== SESSION_STEP.READY_FOR_HINT) {
    return res.status(400).send("Submit an attempt before requesting another hint");
  }

  if (session.hintCount >= MAX_GUIDED_INTERACTIONS) {
    try {
      const { finalAnswer, explanation } = await generateFinalSolution({
        question: session.question,
        hints: session.hints.map((hint) => hint.content),
        attempts: session.attempts.map((attempt) => ({ content: attempt.content, feedback: attempt.feedback })),
      });
      sessionDb.update(id, { isRevealed: true, currentStep: SESSION_STEP.REVEALED, finalAnswer, explanation });
    } catch (err) {
      console.error("[sessions] generateFinalSolution (hint limit) error:", err?.status, err?.message);
      return res.status(502).send(aiErrorMessage(err));
    }
    return res.json(sessionDb.findById(id));
  }

  const newHintNumber = session.hintCount + 1;

  let nextHint;
  try {
    nextHint = await generateNextHint({
      question: session.question,
      previousHints: session.hints.map((hint) => hint.content),
      attempts: session.attempts.map((attempt) => ({ content: attempt.content, feedback: attempt.feedback })),
      hintNumber: newHintNumber,
    });
  } catch (err) {
    console.error("[sessions] generateNextHint error:", err?.status, err?.message);
    return res.status(502).send(aiErrorMessage(err));
  }

  sessionDb.addHint({ sessionId: id, content: nextHint, hintNumber: newHintNumber, createdAt: now() });
  sessionDb.update(id, { hintCount: newHintNumber, currentStep: SESSION_STEP.READY_TO_ATTEMPT });

  return res.json(sessionDb.findById(id));
});

router.post("/sessions/:id/giveup", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const session = sessionDb.findById(id);

  if (!session) return res.status(404).send("Session not found");
  if (!canAccess(req, session)) return res.status(403).send("Forbidden");
  if (session.isRevealed) return res.json(session);
  if (session.realAttemptCount < MIN_REAL_ATTEMPTS_BEFORE_GIVEUP) {
    return res.status(400).send(`Try at least ${MIN_REAL_ATTEMPTS_BEFORE_GIVEUP} real attempts before revealing the answer`);
  }

  try {
    const { finalAnswer, explanation } = await generateFinalSolution({
      question: session.question,
      hints: session.hints.map((hint) => hint.content),
      attempts: session.attempts.map((attempt) => ({ content: attempt.content, feedback: attempt.feedback })),
    });
    sessionDb.update(id, { isRevealed: true, currentStep: SESSION_STEP.REVEALED, finalAnswer, explanation });
  } catch (err) {
    console.error("[sessions] generateFinalSolution (giveup) error:", err?.status, err?.message);
    return res.status(502).send(aiErrorMessage(err));
  }

  return res.json(sessionDb.findById(id));
});

export default router;
