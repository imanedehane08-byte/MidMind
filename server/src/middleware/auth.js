// Handles JWT creation and route protection for authenticated/admin users.
import jwt from "jsonwebtoken";
import { userDb } from "../models/db.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required. Set it before starting.");
}

// Creates the signed token stored by the frontend after login/register.
export function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Checks the Authorization header and attaches the logged-in user to req.user.
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = userDb.findById(payload.id);

    if (!user) {
      return res.status(401).send("User not found");
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch {
    return res.status(401).send("Invalid token");
  }
}

// Allows only admin users to continue to protected admin endpoints.
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).send("Forbidden");
  }
  next();
}
