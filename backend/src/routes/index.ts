import { Router } from "express";
import usersRoutes from "./users.routes";
import storeRoutes from "./store.routes";
import plansRoutes from "./plans.routes";
import swaggerRoutes from "./swagger.routes";
import adminRoutes from "./admin.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import wishlistRoutes from "./wishlist.routes";
import orderRoutes from "./order.routes";
import couponRoutes from "./coupon.routes";
import couponApplyRoutes from "./coupon.apply.routes";
import paymentRoutes from "./payment.routes";
import returnRoutes from "./return.routes";

const router = Router();

// Swagger docs
router.use("/docs", swaggerRoutes);

// User & Auth routes
router.use("/users", usersRoutes);

// Admin routes (tenant admin auth)
router.use("/admins", adminRoutes);

// Admin protected routes
router.use("/admin/categories", categoryRoutes);
router.use("/admin/products", productRoutes);
router.use("/admin/coupons", couponRoutes);

// Store routes (public)
router.use("/store", storeRoutes);

// Plans routes (public)
router.use("/plans", plansRoutes);

// Cart & Wishlist (user authenticated)
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);

// Orders (user authenticated)
router.use("/orders", orderRoutes);

// Coupon apply (user authenticated)
router.use("/coupon", couponApplyRoutes);

// Payments (user authenticated)
router.use("/payments", paymentRoutes);

// Returns (user authenticated)
router.use("/returns", returnRoutes);

export default router;