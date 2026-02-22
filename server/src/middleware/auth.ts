/**
 * Auth Middleware
 * Verifies JWT token and attaches userId to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const JWT_SECRET = config.JWT_SECRET;

export interface AuthRequest extends Request {
    userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    // Try httpOnly cookie first, then Authorization header (backward compat)
    let token: string | undefined;

    if (req.cookies?.auth_token) {
        token = req.cookies.auth_token;
    } else {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided',
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        return next();
    } catch {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
}
