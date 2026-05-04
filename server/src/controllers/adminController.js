import { userDb, sessionDb } from "../models/db.js";

export function getUsers(_req, res) {
  res.json(userDb.all().map((u) => ({
    id:        u.id,
    name:      u.name,
    email:     u.email,
    role:      u.role,
    createdAt: u.createdAt,
  })));
}

export function getSessions(_req, res) {
  res.json(sessionDb.findAll());
}

export function getStats(_req, res) {
  const row = sessionDb.stats();
  const total    = row.total    || 0;
  const revealed = row.revealed || 0;

  res.json({
    totalUsers:          userDb.count(),
    totalSessions:       total,
    revealedSessions:    revealed,
    completionRate:      total ? Math.round((revealed / total) * 10000) / 100 : 0,
    averageHintsUsed:    Math.round((row.avg_hints    || 0) * 10) / 10,
    averageAttemptsUsed: Math.round((row.avg_attempts || 0) * 10) / 10,
  });
}
