import { Router } from "express";
import * as bookingController from "../controllers/booking.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", bookingController.listServices);
router.get("/:id", bookingController.getService);
router.post("/", bookingController.createService);
router.put("/:id", bookingController.updateService);
router.delete("/:id", bookingController.deleteService);

// Service bookings
router.get("/bookings", bookingController.listAdminBookings);
router.put("/bookings/:id/status", bookingController.updateBookingStatus);

export default router;
