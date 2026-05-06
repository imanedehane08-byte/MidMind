// Database model layer: defines the SQLite schema and query helpers.
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "midmind.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    created_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id            INTEGER NOT NULL REFERENCES users(id),
    question           TEXT    NOT NULL,
    current_step       INTEGER NOT NULL DEFAULT 3,
    hint_count         INTEGER NOT NULL DEFAULT 1,
    attempt_count      INTEGER NOT NULL DEFAULT 0,
    real_attempt_count INTEGER NOT NULL DEFAULT 0,
    is_revealed        INTEGER NOT NULL DEFAULT 0,
    final_answer       TEXT,
    explanation        TEXT,
    created_at         TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hints (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    content     TEXT    NOT NULL,
    hint_number INTEGER NOT NULL,
    created_at  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id     INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    content        TEXT    NOT NULL,
    feedback       TEXT,
    attempt_number INTEGER NOT NULL,
    is_correct     INTEGER NOT NULL DEFAULT 0,
    is_gave_up     INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT    NOT NULL
  );
`);

// Converts a raw users table row into the user shape used by controllers.
function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

// Converts a raw hints table row into the hint shape used by the API.
function rowToHint(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    content: row.content,
    hintNumber: row.hint_number,
    createdAt: row.created_at,
  };
}

// Converts a raw attempts table row into the attempt shape used by the API.
function rowToAttempt(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    content: row.content,
    feedback: row.feedback,
    attemptNumber: row.attempt_number,
    isCorrect: row.is_correct === 1,
    isGaveUp: row.is_gave_up === 1,
    createdAt: row.created_at,
  };
}

// Combines one session row with its related hints and attempts.
function rowToSession(row, hintRows = [], attemptRows = []) {
  return {
    id: row.id,
    userId: row.user_id,
    question: row.question,
    currentStep: row.current_step,
    hintCount: row.hint_count,
    attemptCount: row.attempt_count,
    realAttemptCount: row.real_attempt_count,
    isRevealed: row.is_revealed === 1,
    finalAnswer: row.final_answer,
    explanation: row.explanation,
    createdAt: row.created_at,
    hints: hintRows.map(rowToHint),
    attempts: attemptRows.map(rowToAttempt),
  };
}

const stmtHints = db.prepare("SELECT * FROM hints WHERE session_id = ? ORDER BY hint_number");
const stmtAttempts = db.prepare("SELECT * FROM attempts WHERE session_id = ? ORDER BY attempt_number");

// Loads a complete session object from a sessions table row.
function loadFull(row) {
  if (!row) return null;
  return rowToSession(row, stmtHints.all(row.id), stmtAttempts.all(row.id));
}

export const userDb = {
  // Finds one user by email during login/register checks.
  findByEmail(email) {
    return rowToUser(db.prepare("SELECT * FROM users WHERE email = ?").get(email));
  },

  // Finds one user by database id.
  findById(id) {
    return rowToUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
  },

  // Creates a new user row and returns the saved user.
  create({ name, email, passwordHash, role = "user", createdAt }) {
    const info = db.prepare(
      "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(name, email, passwordHash, role, createdAt);
    return rowToUser(db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid));
  },

  // Returns all users for the admin dashboard.
  all() {
    return db.prepare("SELECT * FROM users ORDER BY id").all().map(rowToUser);
  },

  // Counts users for admin statistics.
  count() {
    return db.prepare("SELECT COUNT(*) as n FROM users").get().n;
  },
};

const SESSION_COL_MAP = {
  currentStep: "current_step",
  hintCount: "hint_count",
  attemptCount: "attempt_count",
  realAttemptCount: "real_attempt_count",
  isRevealed: "is_revealed",
  finalAnswer: "final_answer",
  explanation: "explanation",
};

export const sessionDb = {
  // Creates a new learning session row.
  create({ userId, question, currentStep, hintCount, attemptCount, realAttemptCount, createdAt }) {
    const info = db.prepare(`
      INSERT INTO sessions
        (user_id, question, current_step, hint_count, attempt_count, real_attempt_count, is_revealed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(userId, question, currentStep, hintCount, attemptCount, realAttemptCount, createdAt);
    return loadFull(db.prepare("SELECT * FROM sessions WHERE id = ?").get(info.lastInsertRowid));
  },

  // Finds a complete session by id.
  findById(id) {
    return loadFull(db.prepare("SELECT * FROM sessions WHERE id = ?").get(id));
  },

  // Lists all sessions belonging to one user.
  findByUserId(userId) {
    return db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId)
      .map(loadFull);
  },

  // Lists every session for admin views.
  findAll() {
    return db.prepare("SELECT * FROM sessions ORDER BY created_at DESC").all().map(loadFull);
  },

  // Updates only the allowed session fields.
  update(id, fields) {
    const sets = [];
    const vals = [];
    for (const [key, col] of Object.entries(SESSION_COL_MAP)) {
      if (!(key in fields)) continue;
      sets.push(`${col} = ?`);
      vals.push(key === "isRevealed" ? (fields[key] ? 1 : 0) : (fields[key] ?? null));
    }
    if (!sets.length) return;
    vals.push(id);
    db.prepare(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  },

  // Saves a generated hint for a session.
  addHint({ sessionId, content, hintNumber, createdAt }) {
    const info = db.prepare(
      "INSERT INTO hints (session_id, content, hint_number, created_at) VALUES (?, ?, ?, ?)"
    ).run(sessionId, content, hintNumber, createdAt);
    return rowToHint(db.prepare("SELECT * FROM hints WHERE id = ?").get(info.lastInsertRowid));
  },

  // Saves a student attempt and its feedback.
  addAttempt({ sessionId, content, feedback, attemptNumber, isCorrect, isGaveUp, createdAt }) {
    const info = db.prepare(
      "INSERT INTO attempts (session_id, content, feedback, attempt_number, is_correct, is_gave_up, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(sessionId, content, feedback ?? null, attemptNumber, isCorrect ? 1 : 0, isGaveUp ? 1 : 0, createdAt);
    return rowToAttempt(db.prepare("SELECT * FROM attempts WHERE id = ?").get(info.lastInsertRowid));
  },

  // Calculates summary metrics for one user or all users.
  stats(userId = null) {
    const where = userId !== null ? "WHERE user_id = ?" : "";
    const args = userId !== null ? [userId] : [];
    return db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(is_revealed), 0) AS revealed,
        COALESCE(AVG(hint_count), 0) AS avg_hints,
        COALESCE(AVG(real_attempt_count), 0) AS avg_attempts
      FROM sessions ${where}
    `).get(...args);
  },

  // Counts all sessions in the system.
  countAll() {
    return db.prepare("SELECT COUNT(*) as n FROM sessions").get().n;
  },

  // Counts sessions where the final answer was revealed.
  countRevealed() {
    return db.prepare("SELECT COUNT(*) as n FROM sessions WHERE is_revealed = 1").get().n;
  },
};

export default db;
