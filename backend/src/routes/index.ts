import { Router } from "express";
import usersRoutes from "./users.routes";
import storeRoutes from "./store.routes";
import plansRoutes from "./plans.routes";
import swaggerRoutes from "./swagger.routes";
import affiliateRoutes from "./affiliate.routes";

const router = Router();

// Swagger docs
router.use("/docs", swaggerRoutes);

// User & Auth routes
router.use("/users", usersRoutes);

// Store routes (public)
router.use("/store", storeRoutes);

// Plans routes (public)
router.use("/plans", plansRoutes);

// Affiliate routes (authenticated)
router.use("/users/affiliate", affiliateRoutes);

export default router;