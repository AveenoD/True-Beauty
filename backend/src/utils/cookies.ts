import { Response } from "express";

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
  path?: string;
}

const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 0,
  path: "/",
};

export function setAccessTokenCookie(res: Response, token: string) {
  const options: CookieOptions = {
    ...defaultOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  };
  res.cookie("accessToken", token, options);
}

export function setRefreshTokenCookie(res: Response, token: string) {
  const options: CookieOptions = {
    ...defaultOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie("refreshToken", token, options);
}

export function clearAuthCookies(res: Response) {
  res.cookie("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

export function getAccessTokenFromCookie(req: { cookies?: Record<string, string> }): string | null {
  return req.cookies?.accessToken ?? null;
}

export function getRefreshTokenFromCookie(req: { cookies?: Record<string, string> }): string | null {
  return req.cookies?.refreshToken ?? null;
}