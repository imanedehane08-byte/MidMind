import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  list,
  stats,
  create,
  getById,
  submitAttempt,
  requestHint,
  giveUp,
} from "../controllers/sessionController.js";

const router = Router();

router.get("/sessions",             requireAuth, list);
router.get("/sessions/stats",       requireAuth, stats);
router.post("/sessions",            requireAuth, create);
router.get("/sessions/:id",         requireAuth, getById);
router.post("/sessions/:id/attempt",requireAuth, submitAttempt);
router.post("/sessions/:id/hint",   requireAuth, requestHint);
router.post("/sessions/:id/giveup", requireAuth, giveUp);

export default router;
