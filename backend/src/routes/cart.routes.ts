import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";

const router = Router();
router.use(requireTenant);
router.use(authenticateTenantUser);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.put("/items/:id", cartController.updateItem);
router.delete("/items/:id", cartController.removeItem);
router.delete("/", cartController.clearCart);

export default router;
