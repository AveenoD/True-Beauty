import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const fromHeader = req.header("x-request-id");
  const requestId = typeof fromHeader === "string" && fromHeader.trim() ? fromHeader : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}

