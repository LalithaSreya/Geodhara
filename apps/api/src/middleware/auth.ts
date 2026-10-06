import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { UserRole } from '../types/index.js';
import { Permission, hasPermission, ROLE_PERMISSIONS } from '../types/permissions.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  permissions?: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    decoded.permissions = ROLE_PERMISSIONS[decoded.role] || [];
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired. Please refresh session.');
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Session token is invalid or corrupt');
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      decoded.permissions = ROLE_PERMISSIONS[decoded.role] || [];
      req.user = decoded;
    } catch {
      // Ignore for optional auth
    }
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required for this resource');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Access denied. Role '${req.user.role}' is not authorized to access this resource`
      );
    }
    next();
  };
}

export function requirePermission(permission: Permission | Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required for this resource');
    }

    const requiredList = Array.isArray(permission) ? permission : [permission];
    const userRole = req.user.role;

    const hasAll = requiredList.every((p) => hasPermission(userRole, p));
    if (!hasAll) {
      throw new AppError(
        403,
        'INSUFFICIENT_PERMISSIONS',
        `Role '${userRole}' lacks required permission(s): ${requiredList.join(', ')}`,
        { required: requiredList, userRole }
      );
    }

    next();
  };
}
