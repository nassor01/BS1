const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (user, isAdmin = false) => {
    const expiresIn = isAdmin ? '2h' : (process.env.JWT_EXPIRES_IN || '24h');
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn, issuer: 'swahilipot-hub', audience: 'swahilipot-users' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d', issuer: 'swahilipot-hub', audience: 'swahilipot-users' }
    );
};

const generateTempToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email, role: '2fa_pending' },
        process.env.JWT_SECRET,
        { expiresIn: '5m', issuer: 'swahilipot-hub', audience: 'swahilipot-2fa' }
    );
};

const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTempToken,
    generateSecureToken
};
