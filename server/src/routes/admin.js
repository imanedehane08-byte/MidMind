// Defines admin-only API endpoints for users, sessions, and statistics.
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getUsers, getSessions, getStats } from "../controllers/adminController.js";

const router = Router();

router.get("/admin/users",    requireAuth, requireAdmin, getUsers);
router.get("/admin/sessions", requireAuth, requireAdmin, getSessions);
router.get("/admin/stats",    requireAuth, requireAdmin, getStats);

export default router;
