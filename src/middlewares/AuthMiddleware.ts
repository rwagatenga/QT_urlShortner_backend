import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { AuthService } from '../services/AuthService';
import logger from '../utils/logger';

const authService = new AuthService();

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, error: 'Authorization header missing' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, error: 'Token missing' });
      return;
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

    if (!isValidUserPayload(decoded)) {
      res.status(403).json({ success: false, error: 'Invalid token structure' });
      return;
    }

    const user = decoded && decoded.userId && (await authService.findUserById(decoded.userId));
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    logger.error(error instanceof Error ? error.message : error);

    if (!res.headersSent) {
      next(error);
    }
  }
};

const isValidUserPayload = (decoded: string | JwtPayload | undefined): decoded is Express.User => {
  return typeof decoded === 'object' && decoded !== null && 'userId' in decoded;
};

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
