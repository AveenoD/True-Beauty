import { NextFunction, Request, Response } from "express";
import { log } from "../utils/logger";

const REDACT_KEY = /(pass(word)?|token|authorization|cookie|secret|api[_-]?key|refresh)/i;

function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEY.test(k) ? "[REDACTED]" : redact(v);
  }
  return out;
}

function truncateBody(body: unknown, maxLen = 500): unknown {
  if (!body || typeof body !== "object") return body;
  const str = JSON.stringify(body);
  if (str.length <= maxLen) return body;
  try {
    const parsed = JSON.parse(str);
    return { ...parsed, _truncated: true, _originalLength: str.length };
  } catch {
    return str.slice(0, maxLen) + "...[truncated]";
  }
}

function colorMethod(method: string): string {
  switch (method) {
    case "GET":    return `\x1b[36m${method}\x1b[0m`;
    case "POST":   return `\x1b[32m${method}\x1b[0m`;
    case "PUT":    return `\x1b[33m${method}\x1b[0m`;
    case "PATCH":  return `\x1b[35m${method}\x1b[0m`;
    case "DELETE": return `\x1b[31m${method}\x1b[0m`;
    default:       return method;
  }
}

function colorStatus(status: number): string {
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 400) return `\x1b[35m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`;
  return `${status}`;
}

function colorDuration(ms: number): string {
  if (ms >= 3000) return `\x1b[31m${ms}ms\x1b[0m`;
  if (ms >= 1000) return `\x1b[33m${ms}ms\x1b[0m`;
  return `\x1b[90m${ms}ms\x1b[0m`;
}

function getReqBody(req: Request): unknown {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const body = req.body;
  if (!body || typeof body !== "object") return undefined;
  return truncateBody(redact(body));
}

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  // Log incoming request
  const reqBody = getReqBody(req);
  const reqLine = `  ${colorMethod(req.method)}  ${req.originalUrl}`;

  if (reqBody) {
    process.stdout.write(`\x1b[90m[REQ]\x1b[0m ${reqLine}\n`);
    process.stdout.write(`\x1b[90m      body:\x1b[0m ${JSON.stringify(reqBody, null, 2).split("\n").join("\n      ")}\n`);
  } else {
    process.stdout.write(`\x1b[90m[REQ]\x1b[0m ${reqLine}\n`);
  }

  const finish = () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;

    const reqId = req.requestId ?? "-";
    const userId = (req as any).userId ?? "-";
    const ip = req.ip ?? "-";
    const ua = (req.get("user-agent") ?? "-").slice(0, 60);

    // Structured terminal output
    const icon = status >= 400 ? "  ✗" : status >= 300 ? "  →" : "  ✓";
    process.stdout.write(
      `${icon} ${colorMethod(req.method)}  ${req.originalUrl}  ${colorStatus(status)}  ${colorDuration(Number(durationMs.toFixed(2)))}\n`
    );
    process.stdout.write(`      \x1b[90mreqId=${reqId}  userId=${userId}  ip=${ip}\x1b[0m\n`);

    // Log structured data to file/stdout as JSON
    log(
      status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      "http_request",
      {
        requestId: reqId,
        method: req.method,
        path: req.originalUrl,
        status,
        durationMs: Number(durationMs.toFixed(2)),
        ip,
        userAgent: ua,
        userId,
        reqBody: reqBody,
      }
    );
  };

  res.on("finish", finish);
  next();
}
