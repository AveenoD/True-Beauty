import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(authenticateUser);

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addItem);
router.delete("/:id", wishlistController.removeItem);

export default router;
