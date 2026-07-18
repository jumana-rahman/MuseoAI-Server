import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../lib/auth.js";

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const auth = await getAuth();
    if (!auth) return res.status(500).json({ error: "Auth not initialized" });
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.userId = session.user.id;
    req.sessionId = session.session.id;
    next();
  } catch {
    return res.status(401).json({ error: "Authentication required" });
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const auth = await getAuth();
    if (!auth) return next();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.userId = session.user.id;
      req.sessionId = session.session.id;
    }
  } catch {
    // Ignore — proceed as unauthenticated
  }
  next();
}
