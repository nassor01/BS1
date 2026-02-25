# Security Fixes Applied

## Date: 2026-02-22

## Changes Made

| # | Fix | File | Line |
|---|-----|------|------|
| 1 | Secure PIN generation using crypto.randomInt | authController.js | 414 |
| 2 | Removed PIN from console logs | authController.js | 433 |
| 3 | Enabled admin rate limiter | authRoutes.js | 39 |
| 4 | Added authorization check for user bookings | bookingController.js | 327-330 |
| 5 | Activated custom string sanitization (XSS protection) | server.js | 80 |
| 6 | Enforced global CSRF double-submit cookie pattern | server.js, api.js | - |
| 7 | Fixed 403 handler response body consumption bug | api.js | 134-142 |

## Credentials to Rotate

- Database password
- JWT secrets
- Gmail app password
- reCAPTCHA secret key
