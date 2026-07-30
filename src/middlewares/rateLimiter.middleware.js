// ============================================================
// Kisaan Kart — Rate Limiter Middleware (enh #13 security)
// ============================================================
// In-memory sliding-window rate limiter. Protects auth endpoints
// from brute-force OTP guessing at the HTTP layer (in addition
// to the service-layer DB-based limits).
//
// Usage:
//   import { rateLimiter } from "../middlewares/rateLimiter.middleware.js";
//   router.post("/send-otp", rateLimiter({ windowMs: 60000, max: 5 }), handler);
// ============================================================

import { ApiError } from "../utils/ApiError.js";

// In-memory store: Map<key, { count, resetAt }>
const store = new Map();

// Cleanup stale entries every 5 minutes to prevent memory leak.
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
    }
}, 5 * 60 * 1000);

/**
 * Create a rate-limiting middleware.
 *
 * @param {object} opts
 * @param {number} opts.windowMs  - Time window in ms (default: 60s)
 * @param {number} opts.max       - Max requests per window (default: 10)
 * @param {string} [opts.keyFn]   - Custom key extractor (default: IP)
 * @param {string} [opts.message] - Custom error message
 */
export const rateLimiter = ({
    windowMs = 60 * 1000,
    max = 10,
    keyFn = null,
    message = "Too many requests. Please try again later.",
} = {}) => {
    return (req, _res, next) => {
        const key = keyFn
            ? keyFn(req)
            : (req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
               req.socket?.remoteAddress ||
               req.ip ||
               "unknown");

        const now = Date.now();
        let entry = store.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 1, resetAt: now + windowMs };
            store.set(key, entry);
            return next();
        }

        entry.count++;
        if (entry.count > max) {
            const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
            throw new ApiError(429, `${message} Retry after ${retryAfterSec}s.`);
        }

        next();
    };
};

// ─── Prebuilt limiters for common use ───────────────────────

/** OTP send: max 5 per minute per IP */
export const otpSendLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many OTP requests.",
});

/** OTP verify: max 10 per minute per IP */
export const otpVerifyLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many verification attempts.",
});

/** General auth: max 20 per minute per IP */
export const authLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many auth requests.",
});

export default { rateLimiter, otpSendLimiter, otpVerifyLimiter, authLimiter };
