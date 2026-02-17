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
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('department')
        .optional()
        .trim()
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
    body('roomId')
        .isInt({ min: 1 })
        .withMessage('Valid room ID is required'),
    
    body('startTime')
        .isISO8601()
        .withMessage('Valid start time is required')
        .custom((value) => {
            const startTime = new Date(value);
            const now = new Date();
            if (startTime < now) {
                throw new Error('Start time cannot be in the past');
            }
            return true;
        }),
    
    body('endTime')
        .isISO8601()
        .withMessage('Valid end time is required')
        .custom((value, { req }) => {
            const startTime = new Date(req.body.startTime);
            const endTime = new Date(value);
            
            if (endTime <= startTime) {
                throw new Error('End time must be after start time');
            }
            
            const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
            if (duration > 8) {
                throw new Error('Booking duration cannot exceed 8 hours');
            }
            
            return true;
        }),
    
    body('purpose')
        .trim()
        .notEmpty()
        .withMessage('Purpose is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Purpose must be between 10 and 500 characters'),
    
    body('attendees')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Number of attendees must be between 1 and 1000'),
    
    handleValidationErrors
];

/**
 * Validation rules for creating a room
 */
const roomValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Room name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Room name must be between 2 and 100 characters'),
    
    body('capacity')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Capacity must be between 1 and 1000'),
    
    body('amenities')
        .optional()
        .isArray()
        .withMessage('Amenities must be an array'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    handleValidationErrors
];

/**
 * Validation rules for ID parameters
 */
const idParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid ID parameter'),
    
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
        .isIn(['pending', 'approved', 'rejected', 'cancelled'])
        .withMessage('Status must be one of: pending, approved, rejected, cancelled'),
    
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
    bookingStatusValidation,
    handleValidationErrors
};
