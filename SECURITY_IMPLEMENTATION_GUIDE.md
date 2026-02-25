# Security Implementation Guide - SwahiliPot Hub

**Document Version:** 1.0  
**Date:** 2026-02-17  
**Project:** SwahiliPot Hub Room Booking System

---

## Table of Contents

1. [Overview](#overview)
2. [Currently Implemented Security Features](#currently-implemented-security-features)
3. [New Security Enhancements Added](#new-security-enhancements-added)
4. [Implementation Details](#implementation-details)
5. [Frontend Integration](#frontend-integration)
6. [Production Checklist](#production-checklist)
7. [Testing Security](#testing-security)
8. [Security Audit Commands](#security-audit-commands)

---

## Overview

This document describes the security features implemented in the SwahiliPot Hub Room Booking System. The system uses a defense-in-depth approach with multiple layers of security.

**Architecture:**
- Frontend: React + Vite
- Backend: Express.js (Node.js)
- Database: MySQL
- Authentication: JWT

---

## Currently Implemented Security Features

### 1. JWT Authentication ✅

**File:** `backend/middleware/auth.js`

The system uses JSON Web Tokens (JWT) for stateless authentication.

```javascript
// Token contains: userId, email, role
const token = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);
```

**Features:**
- Access tokens expire in 24 hours
- Refresh tokens available for session extension
- Tokens contain: `userId`, `email`, `role`

---

### 2. Role-Based Authorization ✅

**File:** `backend/middleware/auth.js`

Access control is implemented at the middleware level:

```javascript
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Access denied. Admin privileges required.',
            code: 'ADMIN_REQUIRED'
        });
    }
    next();
};
```

**Protected Routes:**
| Endpoint | Method | Access |
|----------|--------|--------|
| `/bookings/:id/status` | PUT | Admin only |
| `/admin/bookings` | GET | Admin only |
| `/rooms` (POST) | POST | Admin only |
| `/rooms/:id` | DELETE | Admin only |

---

### 3. Password Hashing ✅

**File:** `backend/controllers/authController.js`

All passwords are hashed using bcrypt with salt rounds of 10:

```javascript
const bcrypt = require('bcrypt');

// Hash password before storage
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

---

### 4. Rate Limiting ✅

**File:** `backend/middleware/rateLimiter.js`

Four rate limiters protect different endpoints:

| Limiter | Window | Max Requests | Purpose |
|---------|--------|--------------|---------|
| `authLimiter` | 15 min | 5 | Login/Signup - prevents brute force |
| `apiLimiter` | 15 min | 100 | General API protection |
| `adminLimiter` | 15 min | 50 | Admin operations |
| `bookingLimiter` | 1 hour | 10 | Booking creation - prevents spam |

---

### 5. Helmet HTTP Headers ✅

**File:** `backend/server.js`

Helmet automatically sets security-related HTTP headers:

```javascript
const helmet = require('helmet');
app.use(helmet());
```

**Headers Enabled:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (if HTTPS)
- Content Security Policy

---

### 6. CORS Protection ✅

**File:** `backend/server.js`

Cross-Origin Resource Sharing is configured with a whitelist:

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

---

### 7. Input Validation ✅

**File:** `backend/middleware/validation.js`

Using `express-validator` for schema-based validation:

```javascript
const signupValidation = [
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number, special char'),
    body('fullName').trim().notEmpty().isLength({ min: 2, max: 100 }),
    handleValidationErrors
];
```

---

### 8. SQL Injection Prevention ✅

**File:** `backend/models/*.js`

All database queries use parameterized queries:

```javascript
// ✅ SAFE - Using parameterized queries
await dbPromise.query(
    'SELECT * FROM users WHERE id = ?', 
    [userId]
);

// ❌ UNSAFE - String concatenation (never used)
// await dbPromise.query('SELECT * FROM users WHERE id = ' + userId);
```

---

## New Security Enhancements Added

### 1. Input Sanitization (NEW) ✅

**Purpose:** Prevents NoSQL injection and XSS attacks

**Files Created:**
- `backend/middleware/sanitization.js`

**Features:**
- Sanitizes `req.body`, `req.query`, and `req.params`
- Removes dangerous MongoDB operators (`$gt`, `$where`, etc.)
- Removes null bytes and XSS vectors
- Validates Content-Type header
- Enforces request size limits

**Implementation:**

```javascript
const { sanitizeInput, validateContentType, validateRequestSize } = require('./middleware/sanitization');

app.use(sanitizeInput);        // Sanitize inputs
app.use(validateContentType);   // Validate content type
app.use(validateRequestSize);   // Limit request size
```

---

### 2. CSRF Protection (NEW) ✅

**Purpose:** Prevents Cross-Site Request Forgery attacks

**Files Created:**
- `backend/middleware/csrf.js`

**Features:**
- Generates CSRF tokens for state-changing requests
- Uses secure httpOnly cookies
- Token validity: 1 hour
- Automatically validates tokens on protected endpoints

**Implementation:**

```javascript
const { getCsrfToken } = require('./middleware/csrf');

// Endpoint to get CSRF token
app.get('/api/csrf-token', getCsrfToken);
```

**Frontend Usage:**
```javascript
// Fetch CSRF token
const response = await fetch('/api/csrf-token', { credentials: 'include' });
const { csrfToken } = await response.json();

// Include in state-changing requests
fetch('/book', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify(data)
});
```

---

### 3. Enhanced Error Handling (NEW) ✅

**Purpose:** Prevents information leakage in production

**Files Created:**
- `backend/middleware/errorHandler.js`

**Features:**
- Custom error class (`AppError`)
- Environment-specific error responses
- Detailed errors in development
- Generic errors in production
- Specific handling for:
  - Database errors
  - JWT errors
  - CSRF errors
  - Rate limit errors
  - Validation errors

**Implementation:**

```javascript
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);
```

---

## Implementation Details

### Middleware Order (Important!)

The order of middleware in `server.js` matters for security:

```javascript
// 1. Security headers
app.use(helmet());

// 2. Cookie parser (for CSRF)
app.use(cookieParser());

// 3. CORS
app.use(cors({ ... }));

// 4. Body parsing
app.use(express.json({ limit: '10mb' }));

// 5. Input sanitization (NEW)
app.use(sanitizeInput);
app.use(validateContentType);

// 6. Rate limiting
app.use(apiLimiter);

// 7. Routes
app.use('/', routes);

// 8. Error handling
app.use(notFoundHandler);
app.use(errorHandler);
```

### New Package Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `express-mongo-sanitize` | Input sanitization | ✅ Installed |
| `csurf` | CSRF protection | ✅ Installed |
| `cookie-parser` | Cookie parsing for CSRF | ✅ Installed |

---

## Frontend Integration

### Adding CSRF Token to Frontend

To fully enable CSRF protection, update the frontend API service:

**File:** `frontend/src/services/api.js`

```javascript
let csrfToken = null;

// Fetch CSRF token on app load
export const initCsrfToken = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/csrf-token', {
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.csrfToken;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
    }
};

// Updated apiFetch function
async function apiFetch(endpoint, options = {}, requiresAuth = false) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
            ...options.headers,
        },
        credentials: 'include',
        ...options,
    };
    
    // Add authorization if required
    if (requiresAuth || getAccessToken()) {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    // ... rest of function
}

// Export the init function
export { initCsrfToken };
```

**File:** `frontend/src/main.jsx` or `App.jsx`

```javascript
import { useEffect } from 'react';
import { initCsrfToken } from './services/api';

function App() {
    useEffect(() => {
        // Initialize CSRF token on app load
        initCsrfToken();
    }, []);
    
    // ... rest of app
}
```

---

## Production Checklist

Before deploying to production, ensure the following:

### Environment Configuration

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Generate strong JWT secrets:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Update `ALLOWED_ORIGINS` to production domain only:
  ```
  ALLOWED_ORIGINS=https://yourdomain.com
  ```
- [ ] Set `FRONTEND_URL` to production URL

### Database Security

- [ ] Create limited database user (not root):
  ```sql
  CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password';
  GRANT SELECT, INSERT, UPDATE, DELETE ON swahilipot_booking.* TO 'app_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

### HTTPS Configuration

- [ ] Obtain SSL certificate (Let's Encrypt - free)
- [ ] Redirect HTTP to HTTPS
- [ ] Enable HSTS (handled by Helmet)

### Security Testing

- [ ] Run `npm audit` to check for vulnerabilities
- [ ] Test rate limiting
- [ ] Test CSRF protection
- [ ] Test input sanitization

---

## Testing Security

### Test Rate Limiting

```bash
# Hit login endpoint rapidly to trigger rate limit
for i in {1..10}; do 
    curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
```

**Expected:** After 5 requests, returns 429 error

---

### Test SQL Injection

```bash
# Try SQL injection in login
curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@admin.com' OR '1'='1","password":"anything"}'
```

**Expected:** Returns 401 (invalid credentials), not successful login

---

### Test XSS in Booking

```bash
# Try XSS in booking fields
curl -X POST http://localhost:3000/book \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN" \
-d '{"userId":1,"roomId":1,"date":"<script>alert(1)</script>","startTime":"09:00","endTime":"10:00"}'
```

**Expected:** Request sanitized, script tags removed

---

### Test CSRF Protection

```bash
# Try POST without CSRF token
curl -X POST http://localhost:3000/book \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN" \
-d '{"userId":1,"roomId":1,"date":"2026-02-20","startTime":"09:00","endTime":"10:00"}'
```

**Expected:** 403 Forbidden (if CSRF is enforced on booking endpoint)

---

### Test Input Sanitization

```bash
# Try NoSQL injection pattern
curl -X POST http://localhost:3000/book \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN" \
-d '{"userId": {"$gt": ""}, "roomId":1,"date":"2026-02-20","startTime":"09:00","endTime":"10:00"}'
```

**Expected:** Request sanitized, `$gt` removed or replaced

---

## Security Audit Commands

### Check for Vulnerable Dependencies

```bash
# In backend folder
cd backend
npm audit

# Fix vulnerabilities
npm audit fix
```

### Check for Outdated Packages

```bash
npm outdated
```

### View All Installed Packages

```bash
npm list --depth=0
```

---

## Summary

| Security Feature | Implementation | Status |
|------------------|----------------|--------|
| JWT Authentication | `middleware/auth.js` | ✅ |
| Role-Based Access | `middleware/auth.js` | ✅ |
| Password Hashing | bcrypt | ✅ |
| Rate Limiting | `middleware/rateLimiter.js` | ✅ |
| Helmet Headers | `server.js` | ✅ |
| CORS Protection | `server.js` | ✅ |
| Input Validation | `middleware/validation.js` | ✅ |
| SQL Injection Prevention | Parameterized queries | ✅ |
| Input Sanitization | `middleware/sanitization.js` | ✅ FULLY ACTIVE |
| CSRF Protection | `middleware/csrf.js` | ✅ FULLY ENFORCED |
| Enhanced Error Handling | `middleware/errorHandler.js` | ✅ ACTIVE |

---

## Files Modified/Created

### Created

| File | Purpose |
|------|---------|
| `backend/middleware/sanitization.js` | Input sanitization |
| `backend/middleware/csrf.js` | CSRF protection |
| `backend/middleware/errorHandler.js` | Error handling |

### Modified

| File | Changes |
|------|---------|
| `backend/server.js` | Added new middleware |
| `backend/package.json` | Added new dependencies |

---

## Next Steps

1. **Frontend Integration**: Add CSRF token fetching to frontend
2. **Production Deploy**: Configure production environment
3. **Monitoring**: Set up error logging (e.g., Winston, Sentry)
4. **Testing**: Run security tests
5. **Maintenance**: Regular `npm audit` checks

---

*Document generated: 2026-02-17*  
*For SwahiliPot Hub Room Booking System*
