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
    const issues = (err as ZodError).issues ?? [];
    issues.forEach((e) => {
      const path = e.path.join(".") || "_root";
      errors[path] = e.message;
    });
    return ApiResponse.unprocessable(res, "Validation failed", errors);
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const devDetail =
      process.env.NODE_ENV !== "production"
        ? `${err.code}: ${err.message}`
        : undefined;
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[] | undefined)?.join(", ");
        return ApiResponse.conflict(
          res,
          target
            ? `This value already exists (${target})`
            : "A record with this value already exists"
        );
      }
      case "P2003":
        return ApiResponse.error(
          res,
          process.env.NODE_ENV !== "production"
            ? `Invalid reference (foreign key): ${err.message}`
            : "Invalid related record",
          400
        );
      case "P2021":
      case "P2022":
        return ApiResponse.error(
          res,
          "Database schema is out of date. Run: npx prisma migrate deploy",
          500
        );
      case "P2025":
        return ApiResponse.notFound(res, "Record not found");
      default:
        return ApiResponse.error(
          res,
          process.env.NODE_ENV !== "production"
            ? devDetail ?? "Database error"
            : "Database error",
          500
        );
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.unprocessable(
      res,
      process.env.NODE_ENV !== "production" ? err.message : "Invalid data"
    );
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
