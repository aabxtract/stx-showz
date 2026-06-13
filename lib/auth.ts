import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "veritix_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  address: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: MAX_AGE_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload & SessionPayload;
    if (!decoded.userId || !decoded.address) return null;
    return { userId: decoded.userId, address: decoded.address };
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string): void {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(): void {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
