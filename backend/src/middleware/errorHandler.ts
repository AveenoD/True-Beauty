import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "../utils/ApiResponse";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    const issues = (err as any).issues ?? (err as any).errors ?? [];
    issues.forEach((e: any) => {
      const path = e.path.join(".");
      errors[path] = e.message;
    });
    return ApiResponse.unprocessable(res, "Validation failed", errors);
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return ApiResponse.conflict(res, "A record with this value already exists");
      case "P2025":
        return ApiResponse.notFound(res, "Record not found");
      default:
        return ApiResponse.error(res, "Database error", 500);
    }
  }

  // AppError
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return ApiResponse.unauthorized(res, "Invalid token");
  }
  if (err.name === "TokenExpiredError") {
    return ApiResponse.unauthorized(res, "Token expired");
  }

  // Default error
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    500
  );
}
