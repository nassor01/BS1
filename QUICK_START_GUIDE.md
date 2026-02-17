# Quick Start Guide - Phase 1 Sprint 1

## 🚀 Getting Started in 5 Minutes

### Step 1: Environment Setup

1. **Generate JWT Secrets:**
   ```bash
   # Run this command twice to generate two different secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```

2. **Update `.env` file:**
   ```bash
   # Add these lines to backend/.env
   JWT_SECRET=<paste_first_generated_secret>
   JWT_REFRESH_SECRET=<paste_second_generated_secret>
   JWT_EXPIRES_IN=24h
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Start the Server

```bash
npm start
```

You should see:
```
🚀 Server running on port 3000
📍 Frontend URL: http://localhost:5173
✅ Database connected successfully
```

---

## 🔑 API Authentication Guide

### For Public Routes (No Token Needed)
- `GET /rooms` - View all rooms
- `GET /rooms/:id` - View room details
- `POST /signup` - Register new user
- `POST /login` - Login user

### For Authenticated Routes (Token Required)
- `POST /book` - Create booking
- `GET /bookings/user/:userId` - Get user's bookings
- `GET /me` - Get current user info
- `POST /refresh-token` - Refresh access token

### For Admin Routes (Admin Token Required)
- `POST /rooms` - Create room
- `DELETE /rooms/:id` - Delete room
- `GET /admin/bookings` - View all bookings
- `PUT /bookings/:id/status` - Update booking status

---

## 📝 Frontend Integration Examples

### 1. User Signup
```javascript
import authService from './services/authService';

const handleSignup = async () => {
  const result = await authService.signup(
    email,
    password,
    fullName,
    department
  );
  
  if (result.success) {
    // Tokens automatically stored
    // User data in result.data.user
    navigate('/dashboard');
  } else {
    // Show error: result.error
    console.error(result.error);
  }
};
```

### 2. User Login
```javascript
const handleLogin = async () => {
  const result = await authService.login(email, password);
  
  if (result.success) {
    // Tokens automatically stored
    navigate('/dashboard');
  } else {
    setError(result.error);
  }
};
```

### 3. Create Booking (Authenticated)
```javascript
import bookingService from './services/bookingService';

const handleBooking = async () => {
  const result = await bookingService.createBooking({
    roomId: 1,
    startTime: '2026-02-20T10:00:00Z',
    endTime: '2026-02-20T12:00:00Z',
    purpose: 'Team meeting to discuss project milestones',
    attendees: 10
  });
  
  if (result.success) {
    alert('Booking created!');
  } else {
    alert(result.error);
  }
};
```

### 4. Check Authentication Status
```javascript
import authService from './services/authService';

// Check if user is logged in
if (authService.isAuthenticated()) {
  // User has valid token
  const user = authService.getCurrentUser();
  console.log('Logged in as:', user.email);
}

// Check if user is admin
if (authService.isAdmin()) {
  // Show admin features
}
```

### 5. Logout
```javascript
const handleLogout = () => {
  authService.logout(); // Clears tokens and redirects to /login
};
```

---

## 🔒 Password Requirements

**Your password must have:**
- ✅ At least 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (@$!%*?&)

**Examples:**
- ❌ `password` - Too weak
- ❌ `Password` - Missing number and special char
- ❌ `Pass@12` - Too short
- ✅ `SecurePass@123` - Perfect!
- ✅ `MyP@ssw0rd!` - Perfect!

---

## 🧪 Testing the API

### Using curl:

**1. Signup:**
```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass@123",
    "fullName": "John Doe",
    "department": "Engineering"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass@123"
  }'
```

**3. Access Protected Route:**
```bash
curl -X GET http://localhost:3000/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "JWT_SECRET is not defined"
**Solution:** Add JWT_SECRET to your `.env` file

### Issue 2: "Invalid token" on every request
**Solution:** Make sure you're including the "Bearer " prefix:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}` // Note the space after Bearer
}
```

### Issue 3: "Token expired"
**Solution:** Use the refresh token endpoint or login again. The frontend services handle this automatically.

### Issue 4: "Too many authentication attempts"
**Solution:** Wait 15 minutes or use a different IP. This is rate limiting protection.

### Issue 5: CORS error from frontend
**Solution:** Add your frontend URL to ALLOWED_ORIGINS in `.env`

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/login`, `/signup` | 5 requests | 15 minutes |
| `/book` | 10 requests | 1 hour |
| Admin routes | 50 requests | 15 minutes |
| All other routes | 100 requests | 15 minutes |

**Note:** Rate limits are per IP address.

---

## 🎯 Validation Rules

### Email
- Must be valid email format
- Maximum 255 characters
- Automatically normalized

### Password
- See "Password Requirements" above

### Full Name
- 2-100 characters
- Letters, spaces, hyphens, and apostrophes only

### Booking Times
- Start time cannot be in the past
- End time must be after start time
- Maximum booking duration: 8 hours

### Booking Purpose
- 10-500 characters
- Required field

---

## 🔐 Security Features Active

✅ JWT token-based authentication  
✅ Rate limiting on all endpoints  
✅ Input validation and sanitization  
✅ SQL injection prevention  
✅ XSS protection headers  
✅ CSRF protection  
✅ Secure password hashing (bcrypt)  
✅ Role-based access control  
✅ Token expiration and refresh  
✅ CORS whitelisting  

---

## 📞 Need Help?

### Documentation
- **Detailed Guide:** See [PHASE1_SPRINT1_IMPLEMENTATION.md](./PHASE1_SPRINT1_IMPLEMENTATION.md)
- **Summary:** See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

### Test Your Setup
Run the server and try:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## ✅ Checklist Before Starting Development

- [ ] `.env` file has JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Dependencies installed (`npm install`)
- [ ] Database is running and connected
- [ ] Server starts without errors
- [ ] `/health` endpoint returns "ok"
- [ ] Frontend services imported correctly

---

**You're all set! Start building secure features! 🚀**
