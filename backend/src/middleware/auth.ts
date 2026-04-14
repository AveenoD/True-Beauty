import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types";
import prisma from "../config/database";
import { ApiResponse } from "../utils/ApiResponse";
import { getAccessTokenFromCookie } from "../utils/cookies";

// Support both Authorization header and httpOnly cookie
function extractToken(req: AuthenticatedRequest): string | null {
  // First try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1] ?? null;
  }
  // Fallback to cookie
  return getAccessTokenFromCookie(req);
}

async function validateToken(token: string): Promise<{ sub: string; type: string; role?: string }> {
  const payload = verifyAccessToken(token);

  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }

  // Check if token is revoked
  const storedToken = await prisma.authToken.findUnique({
    where: { token },
  });

  if (storedToken && storedToken.revokedAt) {
    throw new Error("Token has been revoked");
  }

  return payload;
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const payload = await validateToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, "User not found or inactive");
    }

    req.user = user;
    req.userId = user.id;
    req.tenantId = user.adminId ?? undefined; // Multi-tenant: tenantId from adminId
    next();
  } catch (error) {
    next(error);
  }
};

export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const payload = await validateToken(token);

    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.isActive) {
      return ApiResponse.unauthorized(res, "Admin not found or inactive");
    }

    req.admin = admin;
    req.adminId = admin.id;
    req.tenantId = admin.id; // Admin is the tenant
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    try {
      const payload = await validateToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (user?.isActive) {
        req.user = user;
        req.userId = user.id;
        req.tenantId = user.adminId ?? undefined;
      }
    } catch {
      // Invalid token, just continue without auth
    }

    next();
  } catch {
    next();
  }
};