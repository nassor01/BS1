const { dbPromise } = require('../config/db');

const SettingsModel = {
    async getAll() {
        const [rows] = await dbPromise.query(
            'SELECT setting_key, setting_value, description, updated_at FROM system_settings ORDER BY setting_key'
        );
        return rows;
    },

    async get(key) {
        const [rows] = await dbPromise.query(
            'SELECT setting_key, setting_value, description FROM system_settings WHERE setting_key = ?',
            [key]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    async set(key, value, updatedBy = null) {
        const [result] = await dbPromise.query(
            'INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?',
            [key, value, updatedBy, value, updatedBy]
        );
        return result;
    },

    async setMultiple(settings, updatedBy = null) {
        const connection = await dbPromise.getConnection();
        try {
            await connection.beginTransaction();
            
            for (const { key, value } of settings) {
                await connection.query(
                    'INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?',
                    [key, value, updatedBy, value, updatedBy]
                );
            }
            
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async getWorkingHours() {
        const [rows] = await dbPromise.query(
            'SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ("working_hours_start", "working_hours_end")'
        );
        
        const result = { start: '08:00', end: '18:00' };
        rows.forEach(row => {
            if (row.setting_key === 'working_hours_start') result.start = row.setting_value;
            if (row.setting_key === 'working_hours_end') result.end = row.setting_value;
        });
        return result;
    },

    async isMaintenanceMode() {
        const [rows] = await dbPromise.query(
            'SELECT setting_value FROM system_settings WHERE setting_key = "maintenance_mode"'
        );
        return rows.length > 0 && rows[0].setting_value === 'true';
    },

    async isWithinWorkingHours() {
        const workingHours = await this.getWorkingHours();
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMin] = workingHours.start.split(':').map(Number);
        const [endHour, endMin] = workingHours.end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        return currentTime >= startTime && currentTime < endTime;
    },

    async getWorkingHoursConfig() {
        const workingHours = await this.getWorkingHours();
        const withinHours = await this.isWithinWorkingHours();
        return {
            start: workingHours.start,
            end: workingHours.end,
            withinHours,
            message: withinHours 
                ? null 
                : `System is only available from ${workingHours.start} to ${workingHours.end}. Please contact support if you need emergency access.`
        };
    }
};

module.exports = SettingsModel;
