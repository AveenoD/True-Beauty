import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger";

const router = Router();

// JSON spec MUST be before swaggerUi.serve (otherwise it gets caught by the catch-all)
router.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Swagger UI
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2em }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 12px }
  `,
  customSiteTitle: "True Beauty API Docs",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "list",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

export default router;