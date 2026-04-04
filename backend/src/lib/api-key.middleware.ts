import type { Request, Response, NextFunction } from "express";

const PUBLIC_ROUTES = [
  { method: "GET", path: "/api/users" },
  { method: "POST", path: "/api/users" },
  { method: "POST", path: "/api/auth/session" },
];

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const isPublic = PUBLIC_ROUTES.some(
    (r) => r.method === req.method && req.path.startsWith(r.path)
  );

  if (isPublic) return next();

  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
