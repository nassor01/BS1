import { authenticatedFetch } from './api';

const superAdminService = {
    async getAdmins() {
        return await authenticatedFetch('/super-admin/admins');
    },

    async getUsers() {
        return await authenticatedFetch('/super-admin/users');
    },

    async promoteUser(userId) {
        return await authenticatedFetch('/super-admin/admins/promote', {
            method: 'POST',
            body: { userId }
        });
    },

    async demoteAdmin(userId) {
        return await authenticatedFetch(`/super-admin/admins/demote/${userId}`, {
            method: 'POST'
        });
    },

    async disableAdmin(userId) {
        return await authenticatedFetch(`/super-admin/admins/${userId}/disable`, {
            method: 'POST'
        });
    },

    async enableAdmin(userId) {
        return await authenticatedFetch(`/super-admin/admins/${userId}/enable`, {
            method: 'POST'
        });
    },

    async getSettings() {
        return await authenticatedFetch('/super-admin/settings');
    },

    async updateSettings(settings) {
        return await authenticatedFetch('/super-admin/settings', {
            method: 'PUT',
            body: { settings }
        });
    },

    async getAuditLogs(params = {}) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.userId) query.append('userId', params.userId);
        if (params.action) query.append('action', params.action);
        if (params.entityType) query.append('entityType', params.entityType);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        
        return await authenticatedFetch(`/super-admin/audit-logs?${query.toString()}`);
    },

    async exportAuditLogs(params = {}) {
        const query = new URLSearchParams();
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        
        return await authenticatedFetch(`/super-admin/audit-logs/export?${query.toString()}`);
    },

    async getAnalytics() {
        return await authenticatedFetch('/super-admin/analytics');
    }
};

export default superAdminService;
