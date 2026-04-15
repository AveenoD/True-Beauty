import { Router } from "express";
import usersRoutes from "./users.routes";
import adminRoutes from "./admin.routes";
import storeRoutes from "./store.routes";
import plansRoutes from "./plans.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import couponRoutes from "./coupon.routes";
import returnRoutes from "./return.routes";
import serviceRoutes from "./service.routes";
import paymentRoutes from "./payment.routes";
import onboardingRoutes from "./onboarding.routes";
import swaggerRoutes from "./swagger.routes";

const router = Router();

// Swagger docs
router.use("/docs", swaggerRoutes);

// User & Auth routes (includes cart, wishlist, orders, returns, payments, bookings)
router.use("/users", usersRoutes);

// Admin routes
router.use("/admin", adminRoutes);

// Admin product routes
router.use("/admin/products", productRoutes);

// Admin order routes
router.use("/admin/orders", orderRoutes);

// Admin coupon routes
router.use("/admin/coupons", couponRoutes);

// Admin return routes
router.use("/admin/returns", returnRoutes);

// Admin service routes
router.use("/admin/services", serviceRoutes);

// Store routes (public)
router.use("/store", storeRoutes);

// Plans routes (public)
router.use("/plans", plansRoutes);

// Payment routes (user)
router.use("/payments", paymentRoutes);

// Onboarding routes (admin)
router.use("/admin/onboarding", onboardingRoutes);

export default router;
