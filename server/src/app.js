import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Protects login and register from repeated password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT) || 20,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limits new sessions only. Attempts and hints should not use this budget.
const sessionWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.SESSION_WRITE_RATE_LIMIT) || 100,
  message: "Hourly new-session limit reached. Please wait before starting another session.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.post("/api/sessions", sessionWriteLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
