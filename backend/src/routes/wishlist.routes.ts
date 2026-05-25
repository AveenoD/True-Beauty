import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";

const router = Router();
router.use(requireTenant);
router.use(authenticateTenantUser);

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addItem);
router.delete("/:id", wishlistController.removeItem);

export default router;
