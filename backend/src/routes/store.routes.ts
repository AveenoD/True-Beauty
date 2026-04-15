import { Router } from "express";
import * as storeController from "../controllers/store.controller";
import * as productController from "../controllers/product.controller";

const router = Router();

// Public store routes (no auth required)
router.get("/products", productController.listPublicProducts);
router.get("/products/:id", productController.getPublicProduct);
router.get("/services", storeController.listServices);
router.get("/services/:id", storeController.getService);

export default router;
