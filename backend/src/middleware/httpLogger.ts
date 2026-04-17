import { NextFunction, Request, Response } from "express";
import { log } from "../utils/logger";

const REDACT_KEY = /(pass(word)?|token|authorization|cookie|secret|api[_-]?key)/i;

function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEY.test(k) ? "[REDACTED]" : redact(v);
  }
  return out;
}

function maybeBody(req: Request) {
  if (process.env.NODE_ENV === "production") return undefined;
  if (req.method === "GET" || req.method === "HEAD") return undefined;

  const body = req.body;
  if (!body || typeof body !== "object") return undefined;

  const redacted = redact(body);
  try {
    const raw = JSON.stringify(redacted);
    if (raw.length > 2000) return { note: "body_omitted_too_large" };
  } catch {
    return { note: "body_omitted_unserializable" };
  }

  return redacted;
}

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  const finish = () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    const contentLengthHeader = res.getHeader("content-length");
    const contentLength =
      typeof contentLengthHeader === "string"
        ? Number.parseInt(contentLengthHeader, 10)
        : typeof contentLengthHeader === "number"
          ? contentLengthHeader
          : undefined;

    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    log(level, "http", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      contentLength,
      body: maybeBody(req),
    });
  };

  res.on("finish", finish);
  next();
}

