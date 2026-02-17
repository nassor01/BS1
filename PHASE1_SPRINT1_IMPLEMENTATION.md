# Phase 1 - Sprint 1: JWT Authentication & Security Implementation

## 📋 Overview

This document provides a comprehensive guide to the security improvements implemented in Sprint 1 of Phase 1 for the BS1 (SwahiliPot Hub Room Booking System). This sprint focuses on establishing a robust authentication and authorization system with modern security best practices.

---

## 🎯 What We've Implemented

### 1. **JWT (JSON Web Token) Authentication System**
### 2. **Role-Based Authorization Middleware**
### 3. **Rate Limiting Protection**
### 4. **Input Validation & Sanitization**
### 5. **Enhanced Password Security**
### 6. **Security Headers with Helmet**

---

## 📚 Detailed Implementation Guide

## 1. JWT Authentication System

### **What is JWT?**

JWT (JSON Web Token) is a secure way to transmit information between parties as a JSON object. Think of it like a **digital passport** that proves who you are without needing to show your credentials every time.

### **Why Did We Implement It?**

**Before (❌ Insecure):**
- User logs in → Frontend stores user data in localStorage
- Every API request → Frontend sends user ID from localStorage
- **Problem:** Anyone can open browser console and change their user ID or role to "admin"!
- **Result:** Zero security, anyone could pretend to be anyone

**After (✅ Secure):**
- User logs in → Server creates a signed JWT token with user info
- Every API request → Frontend sends JWT token
- Server verifies the token signature (can't be faked)
- **Result:** Only the server can create valid tokens, users can't fake their identity

### **How It Works**

```
┌─────────────┐                 ┌─────────────┐
│   Client    │                 │   Server    │
└──────┬──────┘                 └──────┬──────┘
       │                               │
       │  1. POST /login               │
       │  { email, password }          │
       ├──────────────────────────────>│
       │                               │
       │                         2. Verify credentials
       │                         3. Generate JWT
       │                               │
       │  4. Return JWT                │
       │  { accessToken, refreshToken }│
       │<──────────────────────────────┤
       │                               │
       │  5. Store tokens locally      │
       │                               │
       │  6. API Request               │
       │  Header: Bearer <JWT>         │
       ├──────────────────────────────>│
       │                               │
       │                         7. Verify JWT
       │                         8. Extract user info
       │                         9. Process request
       │                               │
       │  10. Response                 │
       │<──────────────────────────────┤
       │                               │
```

### **What We Added**

#### **A. Token Generation (backend/controllers/authController.js)**

```javascript
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '24h',  // Token expires after 24 hours
            issuer: 'swahilipot-hub',
            audience: 'swahilipot-users'
        }
    );
};
```

**What this does:**
- Creates a signed token containing user information
- Sets expiration time (24 hours)
- Signs with secret key (stored in .env)
- Can only be created/verified by the server

#### **B. Two Types of Tokens**

1. **Access Token** (Short-lived: 24 hours)
   - Used for API requests
   - Contains user ID, email, role
   - Expires quickly for security

2. **Refresh Token** (Long-lived: 7 days)
   - Used to get new access tokens
   - Doesn't contain sensitive permissions
   - Allows users to stay logged in

**Why two tokens?**
- If someone steals your access token, it only works for 24 hours
- Refresh token allows you to get a new access token without logging in again
- Better security + better user experience

#### **C. Updated Login Response**

**Before:**
```json
{
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com", "role": "user" }
}
```

**After:**
```json
{
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com", "role": "user" },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Authentication Middleware

### **What is Middleware?**

Middleware is like a **security checkpoint** that checks every request before it reaches your actual code. Think of it like airport security - everyone has to pass through before boarding.

### **Why Did We Implement It?**

**Before (❌ Insecure):**
```javascript
// Any endpoint - NO PROTECTION!
router.post('/book', bookingController.createBooking);
// Anyone can call this, even without logging in
```

**After (✅ Secure):**
```javascript
router.post('/book', authenticate, bookingController.createBooking);
// Must provide valid JWT token to access this
```

### **The Authentication Middleware (backend/middleware/auth.js)**

```javascript
const authenticate = (req, res, next) => {
    try {
        // 1. Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.'
            });
        }

        // 2. Extract token (format: "Bearer <token>")
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;

        // 3. Verify token with secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        // 5. Allow request to continue
        next();
    } catch (error) {
        // Token invalid or expired
        return res.status(401).json({ error: 'Invalid token' });
    }
};
```

**What this does:**
1. Checks if JWT token is in the request header
2. Verifies the token hasn't been tampered with
3. Checks if token hasn't expired
4. Extracts user information and attaches to request
5. Allows the request to proceed

### **Authorization Middleware (Admin Only)**

```javascript
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Access denied. Admin privileges required.'
        });
    }
    next();
};
```

**Usage:**
```javascript
// Only admins can access this
router.get('/admin/bookings', authenticate, authorizeAdmin, controller.getAdminBookings);
```

---

## 3. Rate Limiting

### **What is Rate Limiting?**

Rate limiting is like a **speed governor** on a vehicle - it limits how fast/often someone can do something. This prevents abuse and attacks.

### **Why Did We Implement It?**

**Attack Scenario Without Rate Limiting:**
```
Hacker's script tries to login:
attempt 1: password123 ❌
attempt 2: password1234 ❌
attempt 3: admin123 ❌
...
attempt 1000: correctpass ✅ (Hacked!)

Time taken: 10 seconds
```

**With Rate Limiting:**
```
Hacker's script tries to login:
attempt 1: password123 ❌
attempt 2: password1234 ❌
attempt 3: admin123 ❌
attempt 4: password ❌
attempt 5: admin ❌
--- BLOCKED for 15 minutes ---

Time taken: Would take YEARS to crack
```

### **Rate Limiters We Implemented**

#### **A. Auth Limiter (Strictest)**

```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per 15 minutes
    message: 'Too many login attempts. Try again in 15 minutes.'
});
```

**Applied to:**
- `/signup` - Prevents mass account creation
- `/login` - Prevents brute force password attacks
- `/refresh-token` - Prevents token refresh abuse

#### **B. Booking Limiter**

```javascript
const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 bookings per hour
});
```

**Why?** Prevents someone from booking all rooms maliciously.

#### **C. General API Limiter**

```javascript
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
});
```

**Applied to all routes** to prevent API abuse.

---

## 4. Input Validation & Sanitization

### **What is Input Validation?**

Input validation is like a **bouncer at a club** - checking that everyone meets the requirements before letting them in.

### **Why Did We Implement It?**

**Without Validation (❌ Dangerous):**
```javascript
// User sends:
{
  "email": "not-an-email",
  "password": "123",
  "fullName": "<script>alert('hacked')</script>"
}

// Server blindly accepts and processes ❌
```

**With Validation (✅ Safe):**
```javascript
// Same malicious input
// Server checks:
// - Email format? ❌ REJECTED
// - Password length? ❌ REJECTED
// - Name contains script tags? ❌ REJECTED
```

### **Validation Rules Implemented**

#### **A. Signup Validation**

```javascript
const signupValidation = [
    body('email')
        .trim()                    // Remove whitespace
        .isEmail()                 // Must be valid email
        .normalizeEmail()          // Convert to standard format
        .isLength({ max: 255 }),   // Max 255 characters
    
    body('password')
        .isLength({ min: 8 })      // Minimum 8 characters
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        // Must contain:
        // - At least one lowercase letter
        // - At least one uppercase letter
        // - At least one number
        // - At least one special character
    
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z\s'-]+$/)  // Only letters, spaces, hyphens
];
```

**Password Requirements:**
- ❌ `password` - Too weak
- ❌ `Password123` - No special character
- ❌ `Pass@12` - Too short
- ✅ `SecurePass@123` - Perfect!

#### **B. Booking Validation**

```javascript
body('startTime')
    .isISO8601()                    // Valid date format
    .custom((value) => {
        const startTime = new Date(value);
        const now = new Date();
        if (startTime < now) {
            throw new Error('Cannot book in the past');
        }
        return true;
    })

body('endTime')
    .custom((value, { req }) => {
        const duration = (endTime - startTime) / (1000 * 60 * 60);
        if (duration > 8) {
            throw new Error('Booking cannot exceed 8 hours');
        }
        return true;
    })
```

**What this prevents:**
- Booking rooms in the past
- Booking for more than 8 hours
- Invalid date formats

---

## 5. Enhanced Password Security

### **What Changed?**

#### **Before:**
```javascript
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);
// Takes ~100ms to hash (good, but can be better)
```

#### **After:**
```javascript
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);
// Takes ~400ms to hash (4x slower for hackers!)
```

### **Why Does This Matter?**

**What are salt rounds?**
- Higher rounds = More time to create hash
- For legitimate users: Extra 300ms is unnoticeable
- For hackers trying billions of passwords: Makes it impossible

**Example:**
```
Password: "MyPassword123!"

With 10 rounds:
Hash: $2b$10$abcd... (takes 100ms)
Hacker can try 10 passwords/second

With 12 rounds:
Hash: $2b$12$abcd... (takes 400ms)
Hacker can try 2.5 passwords/second

To crack 1 billion possible passwords:
- 10 rounds: ~3 years
- 12 rounds: ~12 years
```

---

## 6. Security Headers (Helmet)

### **What is Helmet?**

Helmet sets HTTP headers that protect against common web vulnerabilities. It's like putting **armor on your server**.

### **Headers Added:**

```javascript
app.use(helmet());
```

**This automatically adds:**

1. **X-Content-Type-Options: nosniff**
   - Prevents browsers from MIME-sniffing
   - Stops attackers from disguising malicious files

2. **X-Frame-Options: DENY**
   - Prevents your site from being embedded in iframes
   - Protects against clickjacking attacks

3. **X-XSS-Protection: 1; mode=block**
   - Enables browser's XSS filter
   - Blocks pages if XSS attack detected

4. **Strict-Transport-Security**
   - Forces HTTPS connections
   - Prevents man-in-the-middle attacks

---

## 🔄 Updated API Routes

### **Authentication Routes** (`/`)

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| POST | `/signup` | authLimiter, signupValidation | Register new user |
| POST | `/login` | authLimiter, loginValidation | Login user |
| POST | `/refresh-token` | authLimiter | Get new access token |
| GET | `/me` | authenticate | Get current user info |

### **Room Routes** (`/rooms`)

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| GET | `/` | - | Get all rooms (public) |
| GET | `/:id` | idParamValidation | Get room by ID (public) |
| POST | `/` | authenticate, authorizeAdmin, roomValidation | Create room (admin only) |
| DELETE | `/:id` | authenticate, authorizeAdmin, idParamValidation | Delete room (admin only) |

### **Booking Routes** (`/`)

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| POST | `/book` | authenticate, bookingLimiter, bookingValidation | Create booking |
| GET | `/bookings/user/:userId` | authenticate, idParamValidation | Get user's bookings |
| PUT | `/bookings/:id/status` | authenticate, authorizeAdmin, bookingStatusValidation | Update booking status (admin only) |
| GET | `/admin/bookings` | authenticate, authorizeAdmin | Get all bookings (admin only) |

---

## 🔧 Environment Variables

### **New Variables Required**

Add these to your `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### **How to Generate Secure JWT Secrets**

**Option 1: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 64
```

**Option 2: Using Node.js**
```javascript
require('crypto').randomBytes(64).toString('base64')
```

**Option 3: Online Generator**
- Visit: https://generate-secret.vercel.app/64

**⚠️ IMPORTANT:**
- Never commit your `.env` file to Git
- Use different secrets for development and production
- Keep secrets in a secure password manager

---

## 📱 Frontend Integration Guide

### **1. Storing Tokens**

```javascript
// After successful login/signup
const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

const data = await response.json();

// Store tokens
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
localStorage.setItem('user', JSON.stringify(data.user));
```

### **2. Making Authenticated Requests**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('/book', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`  // ← Important!
    },
    body: JSON.stringify(bookingData)
});
```

### **3. Handling Token Expiration**

```javascript
const makeAuthenticatedRequest = async (url, options) => {
    let accessToken = localStorage.getItem('accessToken');
    
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    // If token expired
    if (response.status === 401) {
        const errorData = await response.json();
        
        if (errorData.code === 'TOKEN_EXPIRED') {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            const refreshResponse = await fetch('/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
                const { accessToken: newToken } = await refreshResponse.json();
                localStorage.setItem('accessToken', newToken);
                
                // Retry original request with new token
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${newToken}`
                    }
                });
            } else {
                // Refresh failed - redirect to login
                window.location.href = '/login';
            }
        }
    }
    
    return response;
};
```

### **4. Logout**

```javascript
const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
};
```

---

## 🧪 Testing the Implementation

### **Test 1: Signup with Weak Password**

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "fullName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### **Test 2: Successful Signup**

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass@123",
    "fullName": "Test User",
    "department": "IT"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "fullName": "Test User",
    "department": "IT",
    "role": "user"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### **Test 3: Protected Route Without Token**

```bash
curl -X POST http://localhost:3000/book \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "startTime": "2024-12-25T10:00:00Z",
    "endTime": "2024-12-25T12:00:00Z",
    "purpose": "Team meeting"
  }'
```

**Expected Response:**
```json
{
  "error": "Access denied. No token provided.",
  "code": "NO_TOKEN"
}
```

### **Test 4: Protected Route With Valid Token**

```bash
curl -X POST http://localhost:3000/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "roomId": 1,
    "startTime": "2024-12-25T10:00:00Z",
    "endTime": "2024-12-25T12:00:00Z",
    "purpose": "Team meeting to discuss project progress",
    "attendees": 5
  }'
```

**Expected Response:**
```json
{
  "message": "Booking created successfully",
  "bookingId": 1
}
```

### **Test 5: Rate Limiting**

```bash
# Run this 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
  echo "\nAttempt $i"
done
```

**Expected Response (6th attempt):**
```json
{
  "error": "Too many authentication attempts. Please try again after 15 minutes.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 1703520000
}
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Invalid Token" Error**

**Cause:** Token malformed or missing "Bearer " prefix

**Solution:**
```javascript
// ❌ Wrong
headers: { 'Authorization': accessToken }

// ✅ Correct
headers: { 'Authorization': `Bearer ${accessToken}` }
```

### **Issue 2: "Token Expired" Error**

**Cause:** Access token is older than 24 hours

**Solution:** Use refresh token to get new access token (see Frontend Integration Guide #3)

### **Issue 3: "JWT_SECRET is not defined"**

**Cause:** Missing JWT_SECRET in .env file

**Solution:**
```bash
# Add to .env file
JWT_SECRET=your_generated_secret_here
```

### **Issue 4: CORS Error**

**Cause:** Frontend origin not in ALLOWED_ORIGINS

**Solution:**
```bash
# In .env file
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
```

---

## 📊 Security Improvements Summary

| Security Aspect | Before | After | Impact |
|----------------|--------|-------|--------|
| **Authentication** | Client-side only | JWT with server verification | ⭐⭐⭐⭐⭐ Critical |
| **Authorization** | None | Role-based middleware | ⭐⭐⭐⭐⭐ Critical |
| **Brute Force Protection** | None | Rate limiting (5 attempts/15min) | ⭐⭐⭐⭐⭐ Critical |
| **Password Strength** | 6 chars minimum | 8 chars + complexity rules | ⭐⭐⭐⭐ High |
| **Password Hashing** | 10 rounds | 12 rounds (4x slower) | ⭐⭐⭐ Medium |
| **Input Validation** | Basic | Comprehensive validation | ⭐⭐⭐⭐⭐ Critical |
| **CORS** | Allow all origins | Whitelist specific origins | ⭐⭐⭐⭐ High |
| **Security Headers** | None | Helmet (XSS, Clickjacking, etc.) | ⭐⭐⭐⭐ High |
| **API Abuse Protection** | None | Rate limiting (100 req/15min) | ⭐⭐⭐⭐ High |

---

## 🎓 Key Concepts Explained Simply

### **1. What is a JWT Token?**

Think of it as a **tamper-proof ID card**:
- Contains your information (name, ID, role)
- Signed by the issuer (server)
- Can be verified by anyone who has the signature key
- Cannot be modified without breaking the signature

### **2. Why Bearer Token?**

```
Authorization: Bearer <token>
```

"Bearer" means: "The bearer (person holding this) is authenticated"
- Like showing a ticket at a concert
- The person holding the ticket gets access

### **3. What's the difference between Authentication and Authorization?**

**Authentication:** Proving who you are
- "I am John" (shows ID card)
- Login with email/password

**Authorization:** Proving what you can do
- "I am allowed to enter VIP area" (shows VIP pass)
- Admin role allows deleting rooms

### **4. Why Hash Passwords?**

**Never store plain passwords!**

```
Plain password: "MyPassword123"
If database leaked: Hacker knows your password ❌

Hashed password: "$2b$12$abcdef..."
If database leaked: Hacker has useless string ✅
Cannot reverse hash to get original password
```

### **5. What is Salt in Password Hashing?**

**Salt** = Random data added to password before hashing

```
Without salt:
User A password: "password123"
User B password: "password123"
Both get same hash: "$2b$10$abc..."
Hacker sees duplicate → knows both use same password ❌

With salt:
User A: "password123" + "randomsalt1" = "$2b$12$xyz..."
User B: "password123" + "randomsalt2" = "$2b$12$abc..."
Different hashes → hacker can't tell ✅
```

---

## 📝 Checklist for Deployment

Before deploying to production:

- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Generate strong JWT_REFRESH_SECRET (different from JWT_SECRET)
- [ ] Update ALLOWED_ORIGINS to production domain
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Review and adjust rate limits if needed
- [ ] Test all authentication flows
- [ ] Test password validation
- [ ] Test rate limiting
- [ ] Set up monitoring for failed login attempts
- [ ] Document API for frontend team
- [ ] Create admin account using fix_admin.js script

---

## 🔜 Next Steps (Future Sprints)

### **Sprint 2: Email Verification & Password Reset**
- Email verification for new signups
- Forgot password functionality
- Password reset via email

### **Sprint 3: Two-Factor Authentication (2FA)**
- SMS/Email OTP
- Authenticator app support

### **Sprint 4: Session Management & Audit Logging**
- Track active sessions
- Log all security events
- IP-based restrictions

---

## 📞 Support & Questions

If you encounter issues:

1. Check the "Common Issues & Solutions" section
2. Verify all environment variables are set
3. Check server logs for detailed error messages
4. Test with curl commands provided above

---

## 🎉 Conclusion

We've successfully implemented a **production-grade authentication and authorization system** that:

✅ Protects against common attacks (brute force, injection, XSS, etc.)
✅ Follows industry best practices (JWT, bcrypt, rate limiting)
✅ Provides excellent user experience (refresh tokens, clear error messages)
✅ Scales for future enhancements (email verification, 2FA, etc.)

**Your application is now significantly more secure!**

---

**Document Version:** 1.0  
**Date:** February 17, 2026  
**Author:** Rovo Dev  
**Sprint:** Phase 1 - Sprint 1
