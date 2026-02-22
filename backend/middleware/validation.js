const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    
    next();
};

/**
 * Validation rules for user signup
 */
const signupValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email must not exceed 255 characters'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    
    body('department')
        .trim()
        .notEmpty()
        .withMessage('Department is required')
        .isLength({ max: 100 })
        .withMessage('Department name must not exceed 100 characters'),
    
    handleValidationErrors
];

/**
 * Validation rules for user login
 */
const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

/**
 * Validation rules for creating a booking
 */
const bookingValidation = [
    body('userId')
        .isInt({ min: 1 })
        .withMessage('Valid user ID is required'),
    
    body('roomId')
        .isInt({ min: 1 })
        .withMessage('Valid room ID is required'),
    
    body('date')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Valid date in YYYY-MM-DD format is required')
        .custom((value) => {
            const bookingDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (bookingDate < today) {
                throw new Error('Cannot book for past dates');
            }
            return true;
        }),
    
    body('startTime')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/)
        .withMessage('Valid start time in HH:MM format is required'),
    
    body('endTime')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/)
        .withMessage('Valid end time in HH:MM format is required')
        .custom((value, { req }) => {
            const start = req.body.startTime;
            if (value <= start) {
                throw new Error('End time must be after start time');
            }
            return true;
        }),
    
    body('type')
        .optional()
        .isIn(['booking', 'reservation'])
        .withMessage('Type must be either booking or reservation'),
    
    handleValidationErrors
];

/**
 * Validation rules for creating a room
 */
const roomValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Room name is required'),
    
    body('space')
        .trim()
        .notEmpty()
        .withMessage('Space/location is required'),
    
    body('capacity')
        .optional(),
    
    body('amenities')
        .optional(),
    
    handleValidationErrors
];

/**
 * Validation rules for ID parameters
 */
const idParamValidation = [
    param('id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid ID parameter'),
    
    handleValidationErrors
];

/**
 * Validation rules for user ID parameters
 */
const userIdParamValidation = [
    param('userId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid user ID parameter'),
    
    handleValidationErrors
];

/**
 * Validation rules for updating booking status
 */
const bookingStatusValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid booking ID'),
    
    body('status')
        .isIn(['confirmed', 'rejected', 'cancelled'])
        .withMessage('Status must be one of: confirmed, rejected, cancelled'),
    
    body('adminNotes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Admin notes must not exceed 500 characters'),
    
    handleValidationErrors
];

module.exports = {
    signupValidation,
    loginValidation,
    bookingValidation,
    roomValidation,
    idParamValidation,
    userIdParamValidation,
    bookingStatusValidation,
    handleValidationErrors
};
