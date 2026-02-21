const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/auth');

// All routes require authentication and super admin role
router.use(authenticate);
router.use(authorizeSuperAdmin);

// Admin management
router.get('/admins', superAdminController.getAdmins);
router.get('/users', superAdminController.getUsers);
router.post('/admins/promote', superAdminController.promoteUser);
router.post('/admins/demote/:id', superAdminController.demoteAdmin);
router.post('/admins/:id/disable', superAdminController.disableAdmin);
router.post('/admins/:id/enable', superAdminController.enableAdmin);

// System settings
router.get('/settings', superAdminController.getSettings);
router.put('/settings', superAdminController.updateSettings);

// Audit logs
router.get('/audit-logs', superAdminController.getAuditLogs);
router.get('/audit-logs/export', superAdminController.exportAuditLogs);

// Analytics
router.get('/analytics', superAdminController.getAnalytics);

module.exports = router;
