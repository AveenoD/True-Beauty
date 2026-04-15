import swaggerJsdoc from "swagger-jsdoc";
import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "True Beauty API",
      version: "1.0.0",
      description: "API documentation for True Beauty backend",
      contact: {
        name: "Anees Shaikh",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:9797",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

// Generate swagger spec from JSDoc annotations in route files
let swaggerSpec = swaggerJsdoc(options);

// Merge the full OpenAPI spec from openapi.yml for complete documentation
try {
  const openapiPath = path.join(__dirname, "../docs/openapi.yml");
  if (fs.existsSync(openapiPath)) {
    const fileContents = fs.readFileSync(openapiPath, "utf8");
    const openapiDoc = yaml.load(fileContents) as Record<string, unknown>;
    if (openapiDoc && typeof openapiDoc === "object") {
      if ("paths" in openapiDoc && openapiDoc.paths) {
        swaggerSpec.paths = {
          ...swaggerSpec.paths,
          ...(openapiDoc.paths as Record<string, unknown>),
        };
      }
      if ("components" in openapiDoc && openapiDoc.components) {
        const yamlComponents = openapiDoc.components as Record<string, Record<string, unknown>>;
        swaggerSpec.components = {
          ...swaggerSpec.components,
          schemas: {
            ...swaggerSpec.components?.schemas,
            ...yamlComponents.schemas,
          },
        };
      }
    }
    console.log("📚 Swagger spec loaded from openapi.yml");
    console.log("   YAML paths count:", Object.keys(openapiDoc.paths || {}).length);
    const regPaths = Object.keys(openapiDoc.paths || {}).filter(p => p.includes("register"));
    console.log("   Register paths:", regPaths);
  }
} catch (err) {
  console.warn("⚠️  Could not load openapi.yml:", err);
}

export { swaggerSpec };
