# Admin Super User Implementation Plan

## Overview

This document outlines the implementation of an **Admin Super User** role in the SwahiliPot Hub Room Booking System. The Super Admin will have elevated privileges above regular admins, with full control over the system including user management, system configuration, and audit capabilities.

---

## 1. Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPER ADMIN (super_admin)                                          │
│  • One super admin account                                          │
│  • Full system control                                              │
│  • Create, disable, demote regular admins                          │
│  • System configuration access                                      │
│  • Full audit log access                                            │
│  • Cannot be deleted or demoted by anyone                          │
│  • Mandatory 2FA enforcement                                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN (admin)                                                      │
│  • Manage rooms (add, edit, delete)                                │
│  • Approve/reject bookings and reservations                        │
│  • View active user sessions                                        │
│  • Disconnect active users                                          │
│  • View basic reports                                               │
│  • Cannot manage other admins                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────────┐
│  USER (user)                                                        │
│  • Book rooms                                                       │
│  • Make reservations (single or multi-date)                        │
│  • View their own bookings                                          │
│  • Update profile                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Super Admin Capabilities

### 2.1 Admin Management
| Action | Super Admin | Regular Admin |
|--------|-------------|---------------|
| Create new admin account | YES | NO |
| Promote user to admin | YES | NO |
| Demote admin to user | YES | NO |
| Disable/suspend admin | YES | NO |
| Reset admin password | YES | NO |
| View admin activity | YES | NO |

### 2.2 Room Management
| Action | Super Admin | Regular Admin |
|--------|-------------|---------------|
| Add new room | YES | YES |
| Edit room details | YES | YES |
| Delete room | YES | YES |
| Recover deleted room | YES | NO |

### 2.3 Booking Management
| Action | Super Admin | Regular Admin |
|--------|-------------|---------------|
| Approve/reject bookings | YES | YES |
| View all bookings | YES | YES |
| Cancel any booking | YES | YES |
| Modify booking details | YES | YES |

### 2.4 System Configuration
| Action | Super Admin | Regular Admin |
|--------|-------------|---------------|
| Set working hours | YES | NO |
| Configure email templates | YES | NO |
| Enable/disable features | YES | NO |
| Maintenance mode toggle | YES | NO |

### 2.5 Audit & Security
| Action | Super Admin | Regular Admin |
|--------|-------------|---------------|
| View audit logs | YES | NO |
| Export audit logs | YES | NO |
| View login history (all users) | YES | NO |
| Terminate any session | YES | YES (users only) |

---

## 3. Database Schema Changes

### 3.1 Update Users Table
```sql
-- Update role enum to include super_admin
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user';
```

### 3.2 Create Audit Logs Table
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'e.g., USER_PROMOTED, ROOM_DELETED',
    entity_type VARCHAR(50) COMMENT 'user, room, booking, setting',
    entity_id INT,
    old_value JSON COMMENT 'Previous state',
    new_value JSON COMMENT 'New state',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 Create System Settings Table
```sql
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('working_hours_start', '08:00', 'Default booking start time'),
('working_hours_end', '18:00', 'Default booking end time'),
('maintenance_mode', 'false', 'System maintenance mode flag'),
('require_email_verification', 'true', 'Require email verification for new users'),
('max_booking_days_ahead', '30', 'Maximum days in advance for bookings'),
('enable_multi_date_reservation', 'true', 'Allow multi-date reservations');
```

### 3.4 Create Admin Actions Table (for tracking admin-specific actions)
```sql
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) COMMENT 'user, room, booking',
    target_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Backend Implementation

### 4.1 New Files to Create

```
backend/
├── middleware/
│   └── auth.js                    (UPDATE - add authorizeSuperAdmin)
├── controllers/
│   ├── superAdminController.js    (NEW)
│   └── auditController.js         (NEW)
├── models/
│   ├── auditModel.js              (NEW)
│   └── settingsModel.js           (NEW)
├── routes/
│   └── superAdminRoutes.js        (NEW)
└── scripts/
    └── create-super-admin.js      (NEW - CLI tool)
```

### 4.2 Middleware Updates

**File: `backend/middleware/auth.js`**

Add new middleware functions:
- `authorizeSuperAdmin` - Only super_admin can access
- `authorizeAdminOrSuper` - Both admin and super_admin can access

### 4.3 Super Admin Controller

**File: `backend/controllers/superAdminController.js`**

Key endpoints:
- `promoteUser(userId)` - Promote user to admin
- `demoteAdmin(userId)` - Demote admin to user
- `disableAdmin(userId)` - Suspend admin account
- `enableAdmin(userId)` - Re-enable admin account
- `getAllAdmins()` - List all admins with status
- `getSystemSettings()` - Get all system settings
- `updateSystemSetting(key, value)` - Update a setting
- `getAuditLogs(filters)` - Get filtered audit logs
- `exportAuditLogs(format)` - Export logs as CSV/JSON

### 4.4 Audit Logging Service

**File: `backend/models/auditModel.js`**

Key methods:
- `log(userId, action, entityType, entityId, oldValue, newValue, ipAddress)`
- `getLogs(filters)` - With pagination
- `getLogsByUser(userId)`
- `getLogsByEntity(entityType, entityId)`

### 4.5 API Routes

**File: `backend/routes/superAdminRoutes.js`**

```
GET    /api/super-admin/admins              - List all admins
POST   /api/super-admin/admins/promote      - Promote user to admin
POST   /api/super-admin/admins/demote       - Demote admin to user
POST   /api/super-admin/admins/:id/disable  - Disable admin
POST   /api/super-admin/admins/:id/enable   - Enable admin
GET    /api/super-admin/settings            - Get system settings
PUT    /api/super-admin/settings            - Update settings
GET    /api/super-admin/audit-logs          - Get audit logs
GET    /api/super-admin/audit-logs/export   - Export logs
GET    /api/super-admin/analytics           - System-wide analytics
```

---

## 5. Frontend Implementation

### 5.1 New Files to Create

```
frontend/src/
├── pages/
│   └── SuperAdminDashboard.jsx     (NEW)
├── components/
│   ├── modals/
│   │   ├── PromoteUserModal.jsx    (NEW)
│   │   └── SystemSettingsModal.jsx (NEW)
│   └── super-admin/
│       ├── AdminManagement.jsx     (NEW)
│       ├── AuditLogs.jsx           (NEW)
│       └── SystemSettings.jsx      (NEW)
├── services/
│   └── superAdminService.js        (NEW)
└── App.jsx                         (UPDATE - add route)
```

### 5.2 Super Admin Dashboard Layout

```
+---------------------------------------------------------------------+
|  SUPER ADMIN CONTROL PANEL                           [Logout]       |
+---------------------------------------------------------------------+
|  [Admins]  [Audit Logs]  [System Settings]  [Analytics]            |
+---------------------------------------------------------------------+
|                                                                     |
|  +-------------------------------------------------------------+   |
|  |  Content Area (changes based on selected tab)               |   |
|  |                                                             |   |
|  |  Admins Tab:                                                |   |
|  |  +-----------------------------------------------------+   |   |
|  |  | Name          │ Email        │ Role    │ Actions    |   |   |
|  |  +-----------------------------------------------------+   |   |
|  |  | John Doe      │ john@...     │ admin   │ [Disable]  |   |   |
|  |  | Jane Smith    │ jane@...     │ admin   │ [Disable]  |   |   |
|  |  +-----------------------------------------------------+   |   |
|  |                                                             |   |
|  |  [Promote User to Admin]                                    |   |
|  +-------------------------------------------------------------+   |
|                                                                     |
+---------------------------------------------------------------------+
```

### 5.3 Audit Logs View

```
+---------------------------------------------------------------------+
|  Audit Logs                                                         |
|  +-------------------------------------------------------------+   |
|  | Filter: [Date Range] [User] [Action Type]     [Export CSV] |   |
|  +-------------------------------------------------------------+   |
|                                                                     |
|  +-------------------------------------------------------------+   |
|  | Time         │ User      │ Action          │ Details        |   |
|  +-------------------------------------------------------------+   |
|  | 2:30 PM      │ admin@... │ ROOM_DELETED    │ Conference A   |   |
|  | 2:15 PM      │ john@...  │ USER_PROMOTED   │ user: jane@... |   |
|  | 1:45 PM      │ jane@...  │ BOOKING_APPROVED│ Booking #1234  |   |
|  +-------------------------------------------------------------+   |
|                                                                     |
|  [Previous] Page 1 of 10 [Next]                                    |
+---------------------------------------------------------------------+
```

### 5.4 System Settings Panel

```
+---------------------------------------------------------------------+
|  System Settings                                                    |
|                                                                     |
|  Working Hours                                                      |
|  +-------------------------------------------------------------+   |
|  | Start Time: [08:00]  End Time: [18:00]                     |   |
|  +-------------------------------------------------------------+   |
|                                                                     |
|  Booking Rules                                                      |
|  +-------------------------------------------------------------+   |
|  | Max days ahead: [30]                                        |   |
|  | Multi-date reservation: [x] Enabled                         |   |
|  | Email verification required: [x] Enabled                    |   |
|  +-------------------------------------------------------------+   |
|                                                                     |
|  Maintenance Mode                                                   |
|  +-------------------------------------------------------------+   |
|  | [ ] Enable Maintenance Mode                                 |   |
|  |     Warning: This will prevent all users from booking       |   |
|  +-------------------------------------------------------------+   |
|                                                                     |
|  [Save Changes]                                                     |
+---------------------------------------------------------------------+
```

---

## 6. Super Admin Creation (CLI Tool)

### 6.1 Why CLI Tool?

A command-line script is the **recommended approach** for creating the first Super Admin because:

| Method | Pros | Cons |
|--------|------|------|
| Manual Database | Simple, direct | Error-prone, requires SQL knowledge, no validation |
| Automatic (first admin) | No effort needed | Security risk - whoever creates first admin becomes super admin |
| Environment Variable | Easy to configure | If .env leaks, attacker knows super admin email |
| **CLI Script** | Secure, documented, repeatable, validates input, shows confirmation | Requires server access |

### 6.2 CLI Script Functionality

**File: `backend/scripts/create-super-admin.js`**

The script will:
1. Check if a super admin already exists
2. Prompt for email address
3. Check if user exists in database
4. If exists: Ask to promote existing user
5. If not exists: Prompt for name and password, then create new user
6. Log the action and confirm success

### 6.3 How to Run

```bash
# From the backend directory
cd backend
node scripts/create-super-admin.js
```

**Example Output:**
```
$ node scripts/create-super-admin.js

Super Admin Creation Tool
=========================

Checking for existing super admin...
No super admin found.

Enter email for Super Admin: owner@swahilipothub.co.ke

User found: John Doe (admin)
Promote this user to Super Admin? (y/n): y

SUCCESS: User promoted to Super Admin!
  Email: owner@swahilipothub.co.ke
  Role: super_admin
```

---

## 7. Security Considerations

### 7.1 Super Admin Protection
- Super admin account cannot be deleted (database constraint or code check)
- Super admin cannot be demoted by regular admin
- Super admin role cannot be assigned via API (only via CLI script)
- Super admin must have 2FA enabled (enforced)

### 7.2 Audit Logging
All sensitive actions are logged:
- User promotions/demotions
- Room creations/deletions
- Booking approvals/rejections
- System setting changes
- Admin login attempts
- Session terminations

### 7.3 Session Management
- Super admin sessions have shorter expiry
- Super admin can view all active sessions
- Super admin can terminate any session
- Failed login attempts are logged with IP

---

## 8. Implementation Order

### Phase 1: Database & Auth (Priority: High)
1. Run database migrations (role enum update, new tables)
2. Update auth middleware with `authorizeSuperAdmin`
3. Create and run the super admin creation script

### Phase 2: Backend APIs (Priority: High)
1. Create audit model and logging service
2. Create settings model
3. Create super admin controller
4. Create super admin routes
5. Add audit logging to existing sensitive operations

### Phase 3: Frontend (Priority: Medium)
1. Create super admin service
2. Create Super Admin Dashboard page
3. Create Admin Management component
4. Create Audit Logs component
5. Create System Settings component
6. Update routing to include super admin routes

### Phase 4: Polish (Priority: Low)
1. Add export functionality for audit logs
2. Add analytics dashboard
3. Add email notifications for admin actions
4. Add maintenance mode UI

---

## 9. API Summary

### Super Admin Endpoints (Requires super_admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/super-admin/admins` | List all admins |
| POST | `/api/super-admin/admins/promote` | Promote user to admin |
| POST | `/api/super-admin/admins/demote/:id` | Demote admin to user |
| POST | `/api/super-admin/admins/:id/disable` | Disable admin account |
| POST | `/api/super-admin/admins/:id/enable` | Enable admin account |
| GET | `/api/super-admin/settings` | Get all system settings |
| PUT | `/api/super-admin/settings` | Update system settings |
| GET | `/api/super-admin/audit-logs` | Get audit logs (paginated) |
| GET | `/api/super-admin/audit-logs/export` | Export audit logs |
| GET | `/api/super-admin/users` | List all users (for promotion) |

### Admin Endpoints (Requires admin or super_admin role)
No changes - existing admin endpoints remain the same.

---

## 10. Decisions Summary

| Question | Decision |
|----------|----------|
| How many super admins? | One super admin account |
| Features included? | All: admin management, system config, audit logs |
| Regular admin restrictions? | No changes - can still add/delete rooms |
| How to create super admin? | CLI script (secure, documented, no web exposure) |

---

## 11. Working Hours Enforcement (IMPLEMENTED)

### Overview
Block regular users from accessing the system outside of configured working hours while allowing super admins and admins full access at all times.

### Implementation Details

#### 11.1 Backend Changes

**Settings Model** (`backend/models/settingsModel.js`)
- Added `isWithinWorkingHours()` method - returns boolean based on current time vs configured hours
- Added `getWorkingHoursConfig()` method - returns config with message

**Auth Middleware** (`backend/middleware/auth.js`)
- Added working hours check in `authenticate` function
- Runs on every authenticated API request

**Auth Controller** (`backend/controllers/authController.js`)
- Added working hours check in `login()` function
- Added working hours check in `adminLogin()` function
- Admins and super admins bypass working hours restrictions

**Booking Controller** (`backend/controllers/bookingController.js`)
- Added working hours check in `createBooking()` function
- Returns 403 with `OUTSIDE_WORKING_HOURS` error code when blocked

**Session Manager** (`backend/services/sessionManager.js`)
- Added `getAllSessions()` method to expose all active sessions

**Working Hours Cron** (`backend/cron/workingHoursCron.js`) - NEW
- Runs every minute to check working hours
- Automatically disconnects regular users when working hours end
- Logs out users who are logged in outside working hours
- Does NOT affect admins or super admins

#### 11.2 Frontend Changes

**API Service** (`frontend/src/services/api.js`)
- Added handling for `OUTSIDE_WORKING_HOURS` error (403)
- Automatically clears auth and redirects to login when triggered

**Login Page** (`frontend/src/pages/Login.jsx`)
- Added error handling for `OUTSIDE_WORKING_HOURS` error code
- Shows user-friendly message when blocked (including auto-logout message)

### Error Response Format
```json
{
  "error": "System is only available from 08:00 to 18:00. Please contact support if you need emergency access.",
  "code": "OUTSIDE_WORKING_HOURS",
  "workingHours": {
    "start": "08:00",
    "end": "18:00"
  }
}
```

### Access Rules
| User Role | Login Outside Hours | Book Outside Hours | Auto-Logout When Hours End |
|-----------|---------------------|-------------------|---------------------------|
| super_admin | ✅ Always allowed | ✅ Always allowed | ❌ Never |
| admin | ✅ Always allowed | ✅ Always allowed | ❌ Never |
| user | ❌ Blocked | ❌ Blocked |

---

## Next Steps

1. **Review this plan** and confirm all requirements are captured
2. **Approve** to begin implementation
3. **Implementation** will follow the phased approach outlined above