export type LogLevel = "debug" | "info" | "warn" | "error";

type LogRecord = Record<string, unknown> & {
  level: LogLevel;
  time: string;
  msg: string;
};

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function normalizeLevel(input: string | undefined): LogLevel {
  const v = (input ?? "").toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return "info";
}

const minLevel = normalizeLevel(process.env.LOG_LEVEL);

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel];
}

function safeJsonStringify(value: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_k, v) => {
    if (typeof v === "bigint") return v.toString();
    if (typeof v === "object" && v !== null) {
      if (seen.has(v as object)) return "[Circular]";
      seen.add(v as object);
    }
    return v;
  });
}

export function log(level: LogLevel, msg: string, fields: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return;

  const record: LogRecord = {
    level,
    time: new Date().toISOString(),
    msg,
    ...fields,
  };

  const line = safeJsonStringify(record);
  if (level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export function logError(
  msg: string,
  err: unknown,
  fields: Record<string, unknown> = {}
) {
  const error =
    err instanceof Error
      ? {
          name: err.name,
          message: err.message,
          stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
        }
      : { message: String(err) };

  log("error", msg, { ...fields, error });
}

