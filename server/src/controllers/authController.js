import bcrypt from "bcryptjs";
import { userDb } from "../models/db.js";
import { createToken } from "../middleware/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const MIN_PASSWORD_LENGTH = 8;

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req, res) {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).send("Name, email and password are required");
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).send("Please enter a valid email address");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).send(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (userDb.findByEmail(email)) {
    return res.status(400).send("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = userDb.create({
    name,
    email,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ token: createToken(user), user: sanitizeUser(user) });
}

export async function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const user = userDb.findByEmail(email);
  if (!user) return res.status(401).send("Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).send("Invalid email or password");

  return res.json({ token: createToken(user), user: sanitizeUser(user) });
}

export function me(req, res) {
  const user = userDb.findById(req.user.id);
  if (!user) return res.status(401).send("User not found");
  return res.json(sanitizeUser(user));
}
