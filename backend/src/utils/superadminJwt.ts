import jwt from "jsonwebtoken";

type SuperAdminTokenPayload = {
  sub: string;
  type: "superadmin";
};

const SUPERADMIN_SECRET =
  process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_ACCESS_SECRET || "superadmin-secret-change-me";

const SUPERADMIN_EXPIRY = process.env.SUPERADMIN_JWT_EXPIRY || "12h";

export function generateSuperAdminToken(superAdminId: string) {
  return jwt.sign(
    { sub: superAdminId, type: "superadmin" } as SuperAdminTokenPayload,
    SUPERADMIN_SECRET,
    { expiresIn: SUPERADMIN_EXPIRY } as jwt.SignOptions
  );
}

export function verifySuperAdminToken(token: string): SuperAdminTokenPayload {
  const payload = jwt.verify(token, SUPERADMIN_SECRET) as SuperAdminTokenPayload;
  if (payload.type !== "superadmin") {
    throw new Error("Invalid token type");
  }
  return payload;
}

