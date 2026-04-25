import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller";
import { authenticateUser } from "../middleware/auth";
import { requireTenant } from "../middleware/tenant";

const router = Router();
router.use(requireTenant);
router.use(authenticateUser);

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addItem);
router.delete("/:id", wishlistController.removeItem);

export default router;
