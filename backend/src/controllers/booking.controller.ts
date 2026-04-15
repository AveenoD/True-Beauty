import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as bookingService from "../services/booking.service";
import { AuthenticatedRequest } from "../types";

// User bookings
const createBookingSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID"),
  bookingDate: z.string().min(1, "Booking date is required"),
  bookingTime: z.string().min(1, "Booking time is required"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

const listBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const data = createBookingSchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await bookingService.createBooking(userId, data);
  return ApiResponse.created(res, result, "Service booked successfully");
});

export const listUserBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = listBookingsSchema.parse(req.query);
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await bookingService.listUserBookings(userId, query);
  return ApiResponse.paginated(res, result.data, result.pagination);
});

export const getUserBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await bookingService.getUserBooking(userId, req.params.id);
  return ApiResponse.success(res, result);
});

export const cancelUserBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await bookingService.cancelUserBooking(userId, req.params.id);
  return ApiResponse.success(res, result, "Booking cancelled");
});

// Admin service management
const createServiceSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  duration: z.string().optional(),
  price: z.number().min(0),
  discountedPrice: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  howToUseText: z.string().optional(),
  workingHours: z.string().optional(),
  workingDays: z.string().optional(),
  bookingConfirmationMode: z.enum(["instant", "after_24h"]).optional(),
  status: z.string().optional(),
});

const updateServiceSchema = createServiceSchema.partial();

const listServicesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

const listAdminBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  date: z.string().optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const data = createServiceSchema.parse(req.body);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await bookingService.createService(adminId, data);
  return ApiResponse.created(res, result, "Service created");
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const data = updateServiceSchema.parse(req.body);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await bookingService.updateService(adminId, req.params.id, data);
  return ApiResponse.success(res, result, "Service updated");
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).adminId!;
  await bookingService.deleteService(adminId, req.params.id);
  return ApiResponse.success(res, null, "Service deleted");
});

export const getService = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await bookingService.getService(adminId, req.params.id);
  return ApiResponse.success(res, result);
});

export const listServices = asyncHandler(async (req: Request, res: Response) => {
  const query = listServicesSchema.parse(req.query);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await bookingService.listServices(adminId, query);
  return ApiResponse.paginated(res, result.data, result.pagination);
});

export const listAdminBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = listAdminBookingsSchema.parse(req.query);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await bookingService.listAdminBookings(adminId, query);
  return ApiResponse.paginated(res, result.data, result.pagination);
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = updateBookingStatusSchema.parse(req.body);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await bookingService.updateBookingStatus(adminId, req.params.id, data);
  return ApiResponse.success(res, result, "Booking status updated");
});
