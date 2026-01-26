/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export declare const generalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes per IP
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Violation logging rate limiter
 * 20 requests per minute per IP
 */
export declare const violationLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Response saving rate limiter (auto-save)
 * 30 requests per minute per IP
 */
export declare const responseLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.middleware.d.ts.map