import { Router } from "express";
import { userDb, sessionDb } from "../data/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/admin/users", requireAuth, requireAdmin, (_req, res) => {
  res.json(userDb.all().map((u) => ({
    id:        u.id,
    name:      u.name,
    email:     u.email,
    role:      u.role,
    createdAt: u.createdAt,
  })));
});

router.get("/admin/sessions", requireAuth, requireAdmin, (_req, res) => {
  res.json(sessionDb.findAll());
});

router.get("/admin/stats", requireAuth, requireAdmin, (_req, res) => {
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
});

export default router;
