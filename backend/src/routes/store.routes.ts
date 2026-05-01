import { Router } from "express";
import * as storeController from "../controllers/store.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Public store routes (no auth required)
router.use(requireTenant);
router.get("/products", storeController.listProducts);
router.get("/products/:id", storeController.getProduct);
router.get("/products/:id/reviews", storeController.listProductReviews);
router.get("/products/:id/can-review", authenticateUser, storeController.canReviewProduct);
router.post("/products/:id/reviews", authenticateUser, storeController.createProductReview);
router.get("/services", storeController.listServices);
router.get("/services/:id", storeController.getService);

export default router;