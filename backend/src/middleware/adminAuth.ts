import { Response, NextFunction } from "express";
import { verifyAdminAccessToken } from "../utils/adminJwt";
import { AuthenticatedRequest } from "../types";
import prisma from "../config/database";
import { ApiResponse } from "../utils/ApiResponse";

export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return ApiResponse.unauthorized(res, "No token provided");
    }
    const payload = verifyAdminAccessToken(token);

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
    return next();
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid token type") {
      return ApiResponse.unauthorized(res, "Invalid token type");
    }
    return next(error);
  }
};
