import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// All admin product routes require authentication
router.use(authenticateAdmin);

router.get("/", productController.listProducts);
router.get("/:id", productController.getProduct);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;
