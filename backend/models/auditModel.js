const { dbPromise } = require('../config/db');

const AuditModel = {
    async log({ userId, action, entityType = null, entityId = null, oldValue = null, newValue = null, ipAddress = null, userAgent = null }) {
        try {
            const [result] = await dbPromise.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, action, entityType, entityId, 
                 oldValue ? JSON.stringify(oldValue) : null, 
                 newValue ? JSON.stringify(newValue) : null, 
                 ipAddress, userAgent]
            );
            return result;
        } catch (error) {
            console.error('Audit log error:', error);
            return null;
        }
    },

    async getLogs({ page = 1, limit = 50, userId = null, action = null, entityType = null, startDate = null, endDate = null }) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT al.*, u.email as user_email, u.full_name as user_name
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
            query += ' AND al.action LIKE ?';
            params.push(`%${action}%`);
        }
        if (entityType) {
            query += ' AND al.entity_type = ?';
            params.push(entityType);
        }
        if (startDate) {
            query += ' AND DATE(al.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(al.created_at) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await dbPromise.query(query, params);
        return rows;
    },

    async getCount({ userId = null, action = null, entityType = null, startDate = null, endDate = null }) {
        let query = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        if (action) {
            query += ' AND action LIKE ?';
            params.push(`%${action}%`);
        }
        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }
        if (startDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }

        const [rows] = await dbPromise.query(query, params);
        return rows[0].total;
    },

    async getLogsByUser(userId, limit = 50) {
        const [rows] = await dbPromise.query(
            `SELECT al.*, u.email as user_email, u.full_name as user_name
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.user_id = ?
             ORDER BY al.created_at DESC
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    },

    async getLogsByEntity(entityType, entityId, limit = 50) {
        const [rows] = await dbPromise.query(
            `SELECT al.*, u.email as user_email, u.full_name as user_name
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.entity_type = ? AND al.entity_id = ?
             ORDER BY al.created_at DESC
             LIMIT ?`,
            [entityType, entityId, limit]
        );
        return rows;
    },

    async getAllForExport({ startDate = null, endDate = null }) {
        let query = `
            SELECT al.id, al.action, al.entity_type, al.entity_id, 
                   al.old_value, al.new_value, al.ip_address, al.created_at,
                   u.email as user_email, u.full_name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ' AND DATE(al.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(al.created_at) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY al.created_at DESC';

        const [rows] = await dbPromise.query(query, params);
        return rows;
    }
};

module.exports = AuditModel;
