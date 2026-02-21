const axios = require('axios');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6Ld9vHAsAAAAAFUfCudhT9SN3kzhBttCXLYu0QZA';

const verifyRecaptcha = async (req, res, next) => {
    const recaptchaToken = req.body.captchaToken;
    
    // Skip reCAPTCHA if no token provided (for testing/development)
    if (!recaptchaToken) {
        console.log('⚠️  No reCAPTCHA token provided, skipping verification');
        return next();
    }
    
    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken
                }
            }
        );
        
        if (!response.data.success) {
            console.warn('reCAPTCHA verification failed:', response.data['error-codes']);
            return res.status(403).json({ error: 'reCAPTCHA verification failed', code: 'RECAPTCHA_FAILED' });
        }
        
        next();
    } catch (error) {
        console.error('reCAPTCHA verification error:', error.message);
        // Don't block login on reCAPTCHA error - allow through
        next();
    }
};

module.exports = verifyRecaptcha;
