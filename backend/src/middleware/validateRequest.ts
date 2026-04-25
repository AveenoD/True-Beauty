import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../utils/ApiResponse";

function toFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path || "root"] = issue.message;
  });
  return errors;
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.unprocessable(
          res,
          "Validation failed",
          toFieldErrors(error)
        );
      }
      return next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as unknown as Request["query"];
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.unprocessable(
          res,
          "Validation failed",
          toFieldErrors(error)
        );
      }
      return next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as unknown as Request["params"];
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.unprocessable(
          res,
          "Validation failed",
          toFieldErrors(error)
        );
      }
      return next(error);
    }
  };
}
