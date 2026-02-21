const UserModel = require('../models/userModel');
const BookingModel = require('../models/bookingModel');
const RoomModel = require('../models/roomModel');
const AuditModel = require('../models/auditModel');
const SettingsModel = require('../models/settingsModel');

const superAdminController = {
    // Get all admins
    async getAdmins(req, res) {
        try {
            const [rows] = await UserModel.dbPromise.query(
                `SELECT id, email, full_name, role, department, created_at, 
                        email_verified, totp_enabled, failed_login_attempts, locked_until
                 FROM users 
                 WHERE role IN ('admin', 'super_admin')
                 ORDER BY role DESC, created_at ASC`
            );
            res.json(rows);
        } catch (error) {
            console.error('Get admins error:', error);
            res.status(500).json({ error: 'Failed to fetch admins' });
        }
    },

    // Get all users (for promotion dropdown)
    async getUsers(req, res) {
        try {
            const [rows] = await UserModel.dbPromise.query(
                `SELECT id, email, full_name, role, department, created_at
                 FROM users 
                 WHERE role = 'user'
                 ORDER BY created_at DESC
                 LIMIT 100`
            );
            res.json(rows);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    },

    // Promote user to admin
    async promoteUser(req, res) {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        try {
            const users = await UserModel.findById(userId);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            if (user.role === 'super_admin') {
                return res.status(400).json({ error: 'Cannot modify super admin role' });
            }

            // Log the action
            await AuditModel.log({
                userId: req.user.id,
                action: 'USER_PROMOTED',
                entityType: 'user',
                entityId: userId,
                oldValue: { role: user.role },
                newValue: { role: 'admin' },
                ipAddress: req.ip
            });

            // Update role
            await UserModel.dbPromise.query(
                'UPDATE users SET role = ? WHERE id = ?',
                ['admin', userId]
            );

            console.log(`User ${userId} promoted to admin by ${req.user.email}`);

            res.json({ 
                message: 'User promoted to admin successfully',
                user: { id: userId, email: user.email, role: 'admin' }
            });
        } catch (error) {
            console.error('Promote user error:', error);
            res.status(500).json({ error: 'Failed to promote user' });
        }
    },

    // Demote admin to user
    async demoteAdmin(req, res) {
        const { id } = req.params;

        try {
            const users = await UserModel.findById(id);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            if (user.role === 'super_admin') {
                return res.status(403).json({ error: 'Cannot demote super admin' });
            }

            if (user.role !== 'admin') {
                return res.status(400).json({ error: 'User is not an admin' });
            }

            // Log the action
            await AuditModel.log({
                userId: req.user.id,
                action: 'ADMIN_DEMOTED',
                entityType: 'user',
                entityId: id,
                oldValue: { role: user.role },
                newValue: { role: 'user' },
                ipAddress: req.ip
            });

            // Update role
            await UserModel.dbPromise.query(
                'UPDATE users SET role = ? WHERE id = ?',
                ['user', id]
            );

            console.log(`Admin ${id} demoted to user by ${req.user.email}`);

            res.json({ message: 'Admin demoted to user successfully' });
        } catch (error) {
            console.error('Demote admin error:', error);
            res.status(500).json({ error: 'Failed to demote admin' });
        }
    },

    // Disable admin account
    async disableAdmin(req, res) {
        const { id } = req.params;

        try {
            const users = await UserModel.findById(id);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            if (user.role === 'super_admin') {
                return res.status(403).json({ error: 'Cannot disable super admin' });
            }

            // Log the action
            await AuditModel.log({
                userId: req.user.id,
                action: 'ADMIN_DISABLED',
                entityType: 'user',
                entityId: id,
                oldValue: { status: 'active' },
                newValue: { status: 'disabled' },
                ipAddress: req.ip
            });

            // Lock the account for 1 year
            const lockUntil = new Date();
            lockUntil.setFullYear(lockUntil.getFullYear() + 1);

            await UserModel.dbPromise.query(
                'UPDATE users SET locked_until = ? WHERE id = ?',
                [lockUntil, id]
            );

            console.log(`Admin ${id} disabled by ${req.user.email}`);

            res.json({ message: 'Admin account disabled successfully' });
        } catch (error) {
            console.error('Disable admin error:', error);
            res.status(500).json({ error: 'Failed to disable admin' });
        }
    },

    // Enable admin account
    async enableAdmin(req, res) {
        const { id } = req.params;

        try {
            const users = await UserModel.findById(id);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Log the action
            await AuditModel.log({
                userId: req.user.id,
                action: 'ADMIN_ENABLED',
                entityType: 'user',
                entityId: id,
                oldValue: { status: 'disabled' },
                newValue: { status: 'active' },
                ipAddress: req.ip
            });

            // Unlock the account
            await UserModel.dbPromise.query(
                'UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?',
                [id]
            );

            console.log(`Admin ${id} enabled by ${req.user.email}`);

            res.json({ message: 'Admin account enabled successfully' });
        } catch (error) {
            console.error('Enable admin error:', error);
            res.status(500).json({ error: 'Failed to enable admin' });
        }
    },

    // Get system settings
    async getSettings(req, res) {
        try {
            const settings = await SettingsModel.getAll();
            res.json(settings);
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    },

    // Update system settings
    async updateSettings(req, res) {
        const { settings } = req.body;

        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({ error: 'Settings array is required' });
        }

        try {
            // Log the action
            await AuditModel.log({
                userId: req.user.id,
                action: 'SETTINGS_UPDATED',
                entityType: 'setting',
                newValue: settings,
                ipAddress: req.ip
            });

            await SettingsModel.setMultiple(settings, req.user.id);

            console.log(`Settings updated by ${req.user.email}`);

            res.json({ message: 'Settings updated successfully' });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    },

    // Get audit logs
    async getAuditLogs(req, res) {
        const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;

        try {
            const logs = await AuditModel.getLogs({
                page: parseInt(page),
                limit: parseInt(limit),
                userId: userId || null,
                action: action || null,
                entityType: entityType || null,
                startDate: startDate || null,
                endDate: endDate || null
            });

            const total = await AuditModel.getCount({
                userId: userId || null,
                action: action || null,
                entityType: entityType || null,
                startDate: startDate || null,
                endDate: endDate || null
            });

            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    },

    // Export audit logs
    async exportAuditLogs(req, res) {
        const { startDate, endDate } = req.query;

        try {
            const logs = await AuditModel.getAllForExport({
                startDate: startDate || null,
                endDate: endDate || null
            });

            // Log the export action
            await AuditModel.log({
                userId: req.user.id,
                action: 'AUDIT_LOGS_EXPORTED',
                entityType: 'audit_log',
                ipAddress: req.ip
            });

            res.json(logs);
        } catch (error) {
            console.error('Export audit logs error:', error);
            res.status(500).json({ error: 'Failed to export audit logs' });
        }
    },

    // Get system analytics
    async getAnalytics(req, res) {
        try {
            const db = UserModel.dbPromise;

            // User stats
            const [userStats] = await db.query(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
                    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_30d
                FROM users
            `);

            // Booking stats
            const [bookingStats] = await db.query(`
                SELECT 
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
                    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_bookings,
                    SUM(CASE WHEN type = 'booking' THEN 1 ELSE 0 END) as bookings,
                    SUM(CASE WHEN type = 'reservation' THEN 1 ELSE 0 END) as reservations
                FROM bookings
            `);

            // Room stats
            const [roomStats] = await db.query(`
                SELECT COUNT(*) as total_rooms FROM rooms
            `);

            // Recent activity
            const [recentActivity] = await db.query(`
                SELECT action, COUNT(*) as count
                FROM audit_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY action
                ORDER BY count DESC
                LIMIT 10
            `);

            res.json({
                users: userStats[0],
                bookings: bookingStats[0],
                rooms: roomStats[0],
                recentActivity
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
};

module.exports = superAdminController;
