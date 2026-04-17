import { Router } from "express";
import usersRoutes from "./users.routes";
import storeRoutes from "./store.routes";
import plansRoutes from "./plans.routes";
import swaggerRoutes from "./swagger.routes";
import superadminRoutes from "./superadmin.routes";

const router = Router();

// Swagger docs
router.use("/docs", swaggerRoutes);

// User & Auth routes
router.use("/users", usersRoutes);

// SuperAdmin routes (platform only)
router.use("/superadmin", superadminRoutes);

// Store routes (public)
router.use("/store", storeRoutes);

// Plans routes (public)
router.use("/plans", plansRoutes);

export default router;