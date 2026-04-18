import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticateAdmin } from "../middleware/adminAuth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", categoryController.list);
router.post("/", categoryController.create);
router.get("/:id", categoryController.getOne);
router.put("/:id", categoryController.update);
router.delete("/:id", categoryController.remove);

export default router;
