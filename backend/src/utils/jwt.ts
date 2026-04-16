import jwt from "jsonwebtoken";
import { TokenPayload } from "../types";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export function generateAccessToken(
  userId: string,
  role?: string
): string {
  return jwt.sign(
    { sub: userId, type: "access", role, jti: crypto.randomUUID() } as TokenPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh", jti: crypto.randomUUID() } as TokenPayload,
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}
