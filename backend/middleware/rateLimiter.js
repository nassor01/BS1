const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many authentication attempts. Please try again after 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            error: 'Too many authentication attempts. Please try again after 15 minutes.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
        });
    }
});

const adminAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: 'Too many admin login attempts. Please try again after 15 minutes.',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        console.warn(`⚠️  Admin rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many admin login attempts. Please try again after 15 minutes.',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
        });
    }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        console.warn(`⚠️  API rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
        });
    }
});

const adminApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        error: 'Too many admin API requests. Please try again later.',
        code: 'ADMIN_API_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: {
        error: 'Too many booking requests. Please try again later.',
        code: 'BOOKING_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

module.exports = {
    authLimiter,
    adminAuthLimiter,
    apiLimiter,
    adminApiLimiter,
    bookingLimiter
};
