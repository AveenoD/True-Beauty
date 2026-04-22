import { Router } from "express";
import * as uploadController from "../controllers/upload.controller";
import { authenticateAdmin } from "../middleware/adminAuth";
import { uploadProfilePhoto, uploadProductImage, uploadCategoryImage } from "../middleware/upload";

const router = Router();

router.use(authenticateAdmin);

// Admin profile photo
router.post("/admin/profile-photo", uploadProfilePhoto(), uploadController.uploadProfilePhoto);

// Product images
router.post("/admin/products/image", uploadProductImage(), uploadController.uploadProductImage);

// Category images
router.post("/admin/categories/image", uploadCategoryImage(), uploadController.uploadCategoryImage);

export default router;