import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const docsDir = path.join(process.cwd(), "src", "docs");

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
        url:
          process.env.API_BASE_URL ||
          `http://localhost:${process.env.PORT || 3000}`,
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
  apis: [
    path.join(docsDir, "openapi.yml"),
    path.join(docsDir, "openapi.implemented.yml"),
    "./src/routes/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);