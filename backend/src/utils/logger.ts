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

/** `json` = one line (aggregators). `pretty` = indented blocks in the terminal. Default: pretty in dev, json in production. */
export function logFormat(): "json" | "pretty" {
  const explicit = (process.env.LOG_FORMAT || "").toLowerCase();
  if (explicit === "json") return "json";
  if (explicit === "pretty") return "pretty";
  return process.env.NODE_ENV === "production" ? "json" : "pretty";
}

function safeJsonStringify(value: unknown, space?: number) {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_k, v) => {
      if (typeof v === "bigint") return v.toString();
      if (typeof v === "object" && v !== null) {
        if (seen.has(v as object)) return "[Circular]";
        seen.add(v as object);
      }
      return v;
    },
    space
  );
}

export function log(level: LogLevel, msg: string, fields: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return;

  const record: LogRecord = {
    level,
    time: new Date().toISOString(),
    msg,
    ...fields,
  };

  const fmt = logFormat();
  const line =
    fmt === "pretty"
      ? safeJsonStringify(record, 2)
      : safeJsonStringify(record);
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

