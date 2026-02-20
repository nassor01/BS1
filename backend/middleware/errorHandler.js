/**
 * Enhanced Error Handling Middleware
 * Provides secure error responses based on environment
 */

class AppError extends Error {
    constructor(message, statusCode, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    // Skip Socket.IO paths - they are handled by the Socket.IO server
    if (req.path.startsWith('/socket.io')) {
        return;
    }

    let error = { ...err };
    error.message = err.message;

    // Log error details based on environment
    if (process.env.NODE_ENV === 'development') {
        console.error('🔴 Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            ip: req.ip,
            body: req.body ? '[FILTERED]' : undefined
        });
    } else {
        // Production: Log only essential info
        console.error('🔴 Error:', err.message);
    }

    // Handle Mongoose/DB validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({
            error: message,
            code: 'VALIDATION_ERROR'
        });
    }

    // Handle MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Duplicate entry. This record already exists.',
            code: 'DUPLICATE_ENTRY'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired. Please login again.',
            code: 'TOKEN_EXPIRED'
        });
    }

    // CSRF errors
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            error: 'Invalid CSRF token. Please refresh the page.',
            code: 'CSRF_ERROR'
        });
    }

    // Rate limit errors
    if (err.statusCode === 429) {
        return res.status(429).json({
            error: err.message || 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    // Default error responseCode = err.status
    const statusCode = error.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    res.status(statusCode).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
        // Include error details only in development
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack 
        })
    });
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
    // Skip Socket.IO paths - they are handled by the Socket.IO server
    if (req.path.startsWith('/socket.io')) {
        return;
    }
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
    next(error);
};

const handleMysqlError = (err, req, res, next) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection lost');
        return res.status(503).json({
            error: 'Database connection lost. Please try again later.',
            code: 'DB_CONNECTION_LOST'
        });
    }

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Database access denied');
        return res.status(500).json({
            error: 'Database configuration error',
            code: 'DB_ACCESS_DENIED'
        });
    }

    if (err.code === 'ER_NO_SUCH_TABLE') {
        console.error('Database table not found');
        return res.status(500).json({
            error: 'Database configuration error',
            code: 'DB_TABLE_NOT_FOUND'
        });
    }

    next(err);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
    notFoundHandler,
    handleMysqlError
};
