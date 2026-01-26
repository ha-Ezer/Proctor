import { Request, Response, NextFunction } from 'express';
/**
 * Extended Request interface with user data
 */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        type: 'student' | 'admin';
        role?: string;
    };
}
/**
 * Middleware to verify JWT token and attach user to request
 */
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to verify user is a student
 */
export declare const requireStudent: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to verify user is an admin
 */
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional authentication - attaches user if token is valid, but doesn't block if missing
 */
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map