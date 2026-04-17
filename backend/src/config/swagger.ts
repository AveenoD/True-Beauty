import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";

/**
 * Loads `src/docs/openapi.yml` directly. `swagger-jsdoc` does not merge raw YAML
 * files into `paths`, which caused Swagger UI to show "No operations defined".
 */
function resolveOpenApiPath(): string {
  const candidates = [
    path.join(process.cwd(), "src", "docs", "openapi.yml"),
    path.join(__dirname, "..", "docs", "openapi.yml"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `openapi.yml not found. Tried: ${candidates.join(", ")}`
  );
}

const raw = fs.readFileSync(resolveOpenApiPath(), "utf8");
const spec = parseYaml(raw) as Record<string, unknown>;

const port = process.env.PORT || "9797";
const base =
  (process.env.API_BASE_URL || "").replace(/\/$/, "") ||
  `http://localhost:${port}`;

const servers = spec.servers;
if (Array.isArray(servers) && servers.length > 0 && typeof servers[0] === "object") {
  (servers[0] as { url: string; description?: string }).url = base;
  (servers[0] as { url: string; description?: string }).description =
    "Backend API (this server)";
} else {
  spec.servers = [{ url: base, description: "Backend API (this server)" }];
}

const components = (spec.components ?? {}) as Record<string, unknown>;
const securitySchemes = (components.securitySchemes ?? {}) as Record<string, unknown>;
if (!securitySchemes.bearerAuth) {
  components.securitySchemes = {
    ...securitySchemes,
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  };
  spec.components = components;
}

export const swaggerSpec = spec;
