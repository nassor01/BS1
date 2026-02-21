const { dbPromise } = require('../config/db');

/**
 * Audit Logging Middleware
 * 
 * Records all significant actions (admin operations, auth events, etc.)
 * to the audit_logs table for accountability and security monitoring.
 * 
 * Security Impact: Provides a complete audit trail for compliance,
 * incident response, and detecting suspicious behavior patterns.
 */

const AuditLogger = {
    /**
     * Log an action to the audit_logs table
     * @param {Object} params
     * @param {number|null} params.userId - ID of the user performing the action
     * @param {string} params.action - Action name (e.g., 'LOGIN', 'BOOKING_CREATED')
     * @param {string|null} params.entityType - Type of entity affected (e.g., 'booking', 'room')
     * @param {number|null} params.entityId - ID of the affected entity
     * @param {Object|null} params.details - Additional details as JSON
     * @param {string|null} params.ipAddress - IP address of the requester
     * @param {string|null} params.userAgent - User agent string
     */
    async log({ userId = null, action, entityType = null, entityId = null, details = null, ipAddress = null, userAgent = null }) {
        try {
            // Map details to old_value/new_value for compatibility
            await dbPromise.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, action, entityType, entityId, 
                 details ? JSON.stringify(details) : null, 
                 null, 
                 ipAddress, userAgent]
            );
        } catch (error) {
            // Never let audit logging failure break the main flow
            console.error('⚠️  Audit log failed:', error.message);
        }
    },

    /**
     * Express middleware factory: creates a middleware that logs the action
     * after the response is sent.
     * 
     * Usage: router.post('/rooms', authenticate, authorizeAdmin, auditLog('ROOM_CREATED', 'room'), createRoom)
     */
    middleware(action, entityType = null) {
        return (req, res, next) => {
            // Hook into response finish to log after successful operation
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Only log successful operations (2xx status codes)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const entityId = body?.id || req.params?.id || null;
                    AuditLogger.log({
                        userId: req.user?.id || null,
                        action,
                        entityType,
                        entityId: entityId ? parseInt(entityId) : null,
                        details: {
                            method: req.method,
                            path: req.path,
                            statusCode: res.statusCode
                        },
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent']
                    });
                }
                return originalJson(body);
            };
            next();
        };
    },

    /**
     * Get audit logs (admin only)
     */
    async getLogs({ userId = null, action = null, limit = 50, offset = 0 }) {
        let query = `
            SELECT al.*, u.email, u.full_name 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            query += ' AND al.user_id = ?';
            params.push(userId);
        }
        if (action) {
            query += ' AND al.action = ?';
            params.push(action);
        }

        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await dbPromise.query(query, params);
        return rows;
    }
};

module.exports = AuditLogger;
