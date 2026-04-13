import { Response } from "express";

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message = "Success"
  ) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  static created<T>(res: Response, data: T, message = "Created") {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Record<string, string>
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static unauthorized(res: Response, message = "Unauthorized") {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = "Forbidden") {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = "Not found") {
    return this.error(res, message, 404);
  }

  static badRequest(
    res: Response,
    message = "Bad request",
    errors?: Record<string, string>
  ) {
    return this.error(res, message, 400, errors);
  }

  static conflict(res: Response, message = "Conflict") {
    return this.error(res, message, 409);
  }

  static unprocessable(
    res: Response,
    message: string,
    errors?: Record<string, string>
  ) {
    return this.error(res, message, 422, errors);
  }
}
