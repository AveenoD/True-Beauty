import { Request, Response } from "express";

export const REFRESH_COOKIE_NAME = "tb_refresh";

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  const fromCookie = (req as Request & { cookies?: Record<string, string> })
    .cookies?.[REFRESH_COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const body = req.body as { refreshToken?: string } | undefined;
  return body?.refreshToken;
}
