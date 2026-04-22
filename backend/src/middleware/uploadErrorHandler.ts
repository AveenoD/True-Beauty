import { Request, Response, NextFunction } from "express";

export const uploadErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err.message?.includes("Only image files")) {
    return res.status(400).json({
      statusCode: 400,
      message: err.message,
      data: null,
    });
  }
  if (err.message?.includes("File too large") || err.message?.includes("LIMIT_FILE_SIZE")) {
    return res.status(413).json({
      statusCode: 413,
      message: "File size exceeds 10MB limit",
      data: null,
    });
  }
  return res.status(500).json({
    statusCode: 500,
    message: "Upload failed",
    data: null,
  });
};