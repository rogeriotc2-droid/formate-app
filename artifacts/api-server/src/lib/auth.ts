import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

// bcrypt only uses the first 72 bytes; cap input so an attacker can't force
// huge-payload hashing work on the public signup/signin routes.
export const MAX_PASSWORD_LEN = 200;
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// Reset tokens: the raw token is emailed to the user; we persist only its
// SHA-256 hash, so a DB leak can't be replayed to reset accounts.
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
