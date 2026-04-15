import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import * as cartController from "../controllers/cart.controller";
import * as orderController from "../controllers/order.controller";
import * as couponController from "../controllers/coupon.controller";
import * as returnController from "../controllers/return.controller";
import * as paymentController from "../controllers/payment.controller";
import * as bookingController from "../controllers/booking.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// --- Public Auth Routes ---
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// --- Email Verification Routes (public) ---
router.get("/verify-email", authController.verifyEmail);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

// --- Protected Routes (require auth) ---
router.use(authenticateUser);

router.post("/logout", authController.logout);

// Profile routes
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);

// Address routes
router.get("/addresses", userController.getAddresses);
router.post("/addresses", userController.createAddress);
router.put("/addresses/:id", userController.updateAddress);
router.delete("/addresses/:id", userController.deleteAddress);

// Cart routes
router.get("/cart", cartController.getCart);
router.post("/cart/items", cartController.addToCart);
router.put("/cart/items/:id", cartController.updateCartItem);
router.delete("/cart/items/:id", cartController.removeCartItem);
router.delete("/cart", cartController.clearCart);

// Wishlist routes
router.get("/wishlist", cartController.getWishlist);
router.post("/wishlist", cartController.addToWishlist);
router.delete("/wishlist/:productId", cartController.removeFromWishlist);

// Notification routes
router.get("/notifications", userController.getNotifications);
router.get("/notifications/unread-count", userController.getUnreadCount);
router.put("/notifications/:id/read", userController.markNotificationRead);
router.put("/notifications/read-all", userController.markAllNotificationsRead);

// Order routes
router.post("/orders", orderController.placeOrder);
router.get("/orders", orderController.listUserOrders);
router.get("/orders/:id", orderController.getUserOrder);
router.post("/orders/:id/cancel", orderController.cancelUserOrder);

// Coupon validation
router.post("/coupons/validate", couponController.validateCoupon);

// Returns
router.post("/returns", returnController.createReturn);
router.get("/returns", returnController.listUserReturns);
router.get("/returns/:id", returnController.getUserReturn);

// Payments
router.post("/payments/initiate", paymentController.initiatePayment);
router.post("/payments/verify", paymentController.verifyPayment);
router.get("/payments/status/:orderId", paymentController.getPaymentStatus);

// Service bookings
router.post("/service-bookings", bookingController.createBooking);
router.get("/service-bookings", bookingController.listUserBookings);
router.get("/service-bookings/:id", bookingController.getUserBooking);
router.post("/service-bookings/:id/cancel", bookingController.cancelUserBooking);

export default router;