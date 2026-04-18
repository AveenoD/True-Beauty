import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ADMIN_JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || "access-secret-change-me";
const REFRESH_SECRET = process.env.ADMIN_JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me";
const ACCESS_EXPIRY = process.env.ADMIN_JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.ADMIN_JWT_REFRESH_EXPIRY || "7d";

export interface AdminTokenPayload {
  sub: string;
  type: "admin_access" | "admin_refresh";
  role?: string;
}

export function generateAdminAccessToken(adminId: string, role?: string): string {
  return jwt.sign(
    { sub: adminId, type: "admin_access", role } as AdminTokenPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions
  );
}

export function generateAdminRefreshToken(adminId: string): string {
  return jwt.sign(
    { sub: adminId, type: "admin_refresh" } as AdminTokenPayload,
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions
  );
}

export function verifyAdminAccessToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET) as AdminTokenPayload;
  if (payload.type !== "admin_access") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function verifyAdminRefreshToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, REFRESH_SECRET) as AdminTokenPayload;
  if (payload.type !== "admin_refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}
