import swaggerJsdoc from "swagger-jsdoc";

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
        url: "http://localhost:9797",
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
    "./src/docs/*.yml",
    "./src/docs/*.yaml",
    "./src/routes/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);