import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types";
import prisma from "../config/database";
import { ApiResponse } from "../utils/ApiResponse";

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const parts = authHeader.split(" ");
  return parts[1] ?? null;
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      return ApiResponse.unauthorized(res, "Invalid token type");
    }

    // Check if token is revoked
    const storedToken = await prisma.authToken.findUnique({
      where: { token },
    });

    if (storedToken && storedToken.revokedAt) {
      return ApiResponse.unauthorized(res, "Token has been revoked");
    }

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
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      return ApiResponse.unauthorized(res, "Invalid token type");
    }

    // Check if token is revoked
    const storedToken = await prisma.authToken.findUnique({
      where: { token },
    });

    if (storedToken && storedToken.revokedAt) {
      return ApiResponse.unauthorized(res, "Token has been revoked");
    }

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
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);

    if (payload.type === "access") {
      const storedToken = await prisma.authToken.findUnique({
        where: { token },
      });

      if (!storedToken?.revokedAt) {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (user?.isActive) {
          req.user = user;
          req.userId = user.id;
          req.tenantId = user.adminId ?? undefined;
        }
      }
    }

    next();
  } catch {
    next();
  }
};
