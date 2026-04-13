import { Request } from "express";
import { User, Admin } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: User;
  admin?: Admin;
  userId?: string;
  adminId?: string;
  tenantId?: string; // Required for multi-tenant: must be set in auth middleware
}

export interface TokenPayload {
  sub: string;
  type: "access" | "refresh";
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string>;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
