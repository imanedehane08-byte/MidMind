// Combines all route modules into one router mounted under /api.
import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import adminRouter from "./admin.js";
import sessionsRouter from "./sessions.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(sessionsRouter);

export default router;
