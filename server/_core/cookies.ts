import type { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  const isSecure =
    req.protocol === "https" ||
    req.headers["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    path: "/",
  };
}
