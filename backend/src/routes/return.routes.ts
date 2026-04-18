import { Router } from "express";
import * as returnController from "../controllers/return.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(authenticateUser);

router.post("/", returnController.create);
router.get("/", returnController.list);
router.get("/:id", returnController.getOne);

export default router;
