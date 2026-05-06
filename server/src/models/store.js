// Seeds the first admin user when the server starts and no admin exists yet.
import bcrypt from "bcryptjs";
import { userDb } from "./db.js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD env var is required. Set it before starting.");
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@midmind.com").toLowerCase();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

if (!userDb.findByEmail(ADMIN_EMAIL)) {
  userDb.create({
    name: "Admin",
    email: ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, BCRYPT_ROUNDS),
    role: "admin",
    createdAt: new Date().toISOString(),
  });
}
