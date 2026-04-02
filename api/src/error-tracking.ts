import { Request, Response, NextFunction } from 'express';

export interface ErrorEvent {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  errorMessage: string;
  stack?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
}

const MAX_ERRORS = 1000;
const recentErrors: ErrorEvent[] = [];

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track an error event in the recent errors buffer.
 * @param error - Error event to track
 */
export function trackError(error: ErrorEvent): void {
  recentErrors.unshift(error);
  if (recentErrors.length > MAX_ERRORS) {
    recentErrors.pop();
  }
}

/**
 * Get recent error events.
 * @param limit - Maximum number of errors to return (default 100)
 * @returns Array of recent error events
 */
export function getRecentErrors(limit: number = 100): ErrorEvent[] {
  return recentErrors.slice(0, limit);
}

/**
 * Get aggregated error statistics.
 * @returns Object with total errors, last 24h count, and breakdowns by status code and path
 */
export function getErrorStats(): {
  total: number;
  last24h: number;
  byStatusCode: Record<number, number>;
  byPath: Record<string, number>;
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  
  const last24h = recentErrors.filter(e => new Date(e.timestamp).getTime() > dayAgo).length;
  const byStatusCode: Record<number, number> = {};
  const byPath: Record<string, number> = {};
  
  for (const err of recentErrors) {
    byStatusCode[err.statusCode] = (byStatusCode[err.statusCode] || 0) + 1;
    byPath[err.path] = (byPath[err.path] || 0) + 1;
  }
  
  return {
    total: recentErrors.length,
    last24h,
    byStatusCode,
    byPath,
  };
}

/**
 * Clear all tracked errors.
 */
export function clearErrors(): void {
  recentErrors.length = 0;
}

/**
 * Express middleware that tracks HTTP errors (4xx and 5xx responses).
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function (body): Response {
    if (res.statusCode >= 400) {
      const errorEvent: ErrorEvent = {
        id: generateErrorId(),
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        errorMessage: res.statusMessage || 'Internal Server Error',
        stack: new Error().stack,
        userId: (req as any).user?.userId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };
      trackError(errorEvent);
    }
    return originalSend.call(this, body);
  };
  
  next();
}