const nodeCron = require('node-cron');
const SettingsModel = require('../models/settingsModel');
const sessionManager = require('../services/sessionManager');

function startWorkingHoursCron() {
    // Run every minute to check working hours
    nodeCron.schedule('* * * * *', async () => {
        try {
            const config = await SettingsModel.getWorkingHoursConfig();
            
            // If we're within working hours, nothing to do
            if (config.withinHours) {
                return;
            }

            // Outside working hours - kick out regular users
            console.log(`⏰ Outside working hours (${config.start}-${config.end}). Disconnecting regular users...`);
            
            const activeSessions = sessionManager.getAllSessions();
            
            for (const session of activeSessions) {
                // Skip admins and super admins
                if (session.role === 'admin' || session.role === 'super_admin') {
                    continue;
                }

                // Remove regular user session
                sessionManager.removeSession(session.userId);
                console.log(`👤 User ${session.email} logged out (outside working hours)`);
            }
        } catch (error) {
            console.error('Working hours cron error:', error.message);
        }
    });

    console.log('✅ Working hours enforcement cron started');
}

module.exports = startWorkingHoursCron;
