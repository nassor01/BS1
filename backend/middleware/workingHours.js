const SettingsModel = require('../models/settingsModel');

const checkWorkingHours = async (req, res, next) => {
    try {
        const userRole = req.body.role || req.user?.role;
        
        if (userRole === 'super_admin' || userRole === 'admin') {
            return next();
        }

        const config = await SettingsModel.getWorkingHoursConfig();
        
        if (!config.withinHours) {
            return res.status(403).json({
                error: config.message,
                code: 'OUTSIDE_WORKING_HOURS',
                workingHours: {
                    start: config.start,
                    end: config.end
                }
            });
        }
        
        next();
    } catch (error) {
        console.error('Working hours check error:', error.message);
        next();
    }
};

module.exports = { checkWorkingHours };
