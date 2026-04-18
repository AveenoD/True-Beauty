import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(authenticateUser);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.put("/items/:id", cartController.updateItem);
router.delete("/items/:id", cartController.removeItem);
router.delete("/", cartController.clearCart);

export default router;
