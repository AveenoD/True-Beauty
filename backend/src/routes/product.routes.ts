import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticateAdmin } from "../middleware/adminAuth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", productController.list);
router.post("/", productController.create);
router.get("/:id", productController.getOne);
router.put("/:id", productController.update);
router.delete("/:id", productController.remove);
router.post("/inventory/adjust", productController.adjustInventory);

export default router;
