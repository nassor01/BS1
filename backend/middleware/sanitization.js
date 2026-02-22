/**
 * Security Middleware - Input Sanitization
 * Protects against NoSQL injection and sanitizes user inputs
 * 
 * Even though this project uses MySQL (not MongoDB), this middleware
 * provides additional protection by sanitizing special characters
 * that could be used in injection attacks
 */

const mongoSanitize = require('express-mongo-sanitize');

/**
 * Middleware to sanitize request data
 * Removes keys that could be used for injection attacks
 */
const sanitizeInput = (req, res, next) => {
    // Sanitize request body only (not query params to preserve date filters, etc.)
    if (req.body) {
        req.body = mongoSanitize.sanitize(req.body, {
            replaceWith: '_',
            allowDots: false
        });
    }

    next();
};

/**
 * Additional custom sanitization for common attack vectors
 */
const customSanitize = (req, res, next) => {
    // Remove null bytes and other dangerous characters from string inputs
    const sanitizeStrings = (obj) => {
        if (typeof obj === 'string') {
            // Remove null bytes
            let sanitized = obj.replace(/\0/g, '');
            // Remove common XSS vectors
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            sanitized = sanitized.replace(/javascript:/gi, '');
            sanitized = sanitized.replace(/on\w+\s*=/gi, '');
            return sanitized;
        }
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            for (const key in obj) {
                obj[key] = sanitizeStrings(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = sanitizeStrings(req.body);
    if (req.query) req.query = sanitizeStrings(req.query);
    if (req.params) req.params = sanitizeStrings(req.params);

    next();
};

/**
 * Prevent parameter pollution (DPP)
 * Handles duplicate query parameters that could cause issues
 */
const preventParameterPollution = (req, res, next) => {
    // Check for nested objects that might indicate pollution
    if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
            if (typeof req.query[key] === 'object' && !Array.isArray(req.query[key])) {
                console.warn(`⚠️  Parameter pollution detected: ${key}`);
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    code: 'PARAM_POLLUTION_DETECTED'
                });
            }
        }
    }
    next();
};

/**
 * Validate content-type for POST/PUT requests
 * Prevents content-type spoofing attacks
 */
const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        
        if (!contentType) {
            return res.status(415).json({
                error: 'Content-Type header is required',
                code: 'MISSING_CONTENT_TYPE'
            });
        }

        // Only allow JSON content types
        if (!contentType.includes('application/json')) {
            return res.status(415).json({
                error: 'Only application/json content type is supported',
                code: 'UNSUPPORTED_CONTENT_TYPE'
            });
        }
    }
    next();
};

/**
 * Request size limit validation
 * Prevents large payload attacks
 */
const validateRequestSize = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 100 * 1024; // 100KB default
    
    // Determine the endpoint path (include baseUrl for mounted routes)
    const baseUrl = req.baseUrl || '';
    const path = req.path;
    const fullPath = baseUrl + path; // e.g., '/rooms/1'
    
    let limit = maxSize;

    // Allow larger payload for POST/PUT/DELETE on specific endpoints
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        // Room endpoints need more space for amenities JSON
        if (fullPath.startsWith('/rooms')) {
            limit = 50 * 1024;
        }
        // Booking endpoint
        else if (fullPath === '/book' || fullPath.startsWith('/book')) {
            limit = 10 * 1024;
        }
        // Signup endpoint
        else if (fullPath === '/signup') {
            limit = 10 * 1024;
        }
    }

    if (contentLength > limit) {
        console.warn(`⚠️  Request size exceeded: ${contentLength} bytes (max: ${limit})`);
        return res.status(413).json({
            error: `Request payload too large. Maximum size is ${limit} bytes`,
            code: 'PAYLOAD_TOO_LARGE'
        });
    }

    next();
};

module.exports = {
    sanitizeInput,
    customSanitize,
    preventParameterPollution,
    validateContentType,
    validateRequestSize
};
