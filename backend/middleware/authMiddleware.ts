import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from '../models/User';

// Makes req.user available (typed) in every route after requireAuth.
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

const TOKEN_LIFETIME = '7d';

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: TOKEN_LIFETIME });
}

/** Rejects the request with 401 unless it carries a valid "Bearer <token>" header for an existing user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Please log in to continue' });
  }

  let userId: string;
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as { id?: string };
    if (!payload.id) throw new Error('Token has no user id');
    userId = payload.id;
  } catch {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Account no longer exists' });
  }

  req.user = user;
  next();
}

/** Must be used after requireAuth. Rejects non-admin users with 403. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}
