const { dbPromise } = require('../config/db');

const UserModel = {
    // ============================================================
    // BASIC QUERIES
    // ============================================================

    async findByEmail(email) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows;
    },

    async create(email, passwordHash, fullName, department, role = 'user') {
        const [result] = await dbPromise.query(
            'INSERT INTO users (email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, fullName, department || null, role]
        );
        return result;
    },

    // ============================================================
    // EMAIL VERIFICATION
    // ============================================================

    async setVerificationToken(userId, token, expiresAt) {
        const [result] = await dbPromise.query(
            'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
            [token, expiresAt, userId]
        );
        return result;
    },

    async findByVerificationToken(token) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM users WHERE verification_token = ? AND verification_expires > NOW()',
            [token]
        );
        return rows;
    },

    async markEmailVerified(userId) {
        const [result] = await dbPromise.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = ?',
            [userId]
        );
        return result;
    },

    // ============================================================
    // PASSWORD RESET
    // ============================================================

    async setPasswordResetToken(userId, token, expiresAt) {
        const [result] = await dbPromise.query(
            'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
            [token, expiresAt, userId]
        );
        return result;
    },

    async findByPasswordResetToken(token) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
            [token]
        );
        return rows;
    },

    async updatePassword(userId, passwordHash) {
        const [result] = await dbPromise.query(
            'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
            [passwordHash, userId]
        );
        return result;
    },

    async clearPasswordResetToken(userId) {
        const [result] = await dbPromise.query(
            'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [userId]
        );
        return result;
    },

    // ============================================================
    // ACCOUNT LOCKOUT
    // ============================================================

    async incrementFailedAttempts(userId) {
        const [result] = await dbPromise.query(
            'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
            [userId]
        );
        return result;
    },

    async lockAccount(userId, lockedUntil) {
        const [result] = await dbPromise.query(
            'UPDATE users SET locked_until = ?, failed_login_attempts = 5 WHERE id = ?',
            [lockedUntil, userId]
        );
        return result;
    },

    async resetFailedAttempts(userId) {
        const [result] = await dbPromise.query(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
            [userId]
        );
        return result;
    },

    async isAccountLocked(userId) {
        const [rows] = await dbPromise.query(
            'SELECT locked_until, failed_login_attempts FROM users WHERE id = ? AND locked_until > NOW()',
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    // ============================================================
    // TWO-FACTOR AUTHENTICATION
    // ============================================================

    async setTotpSecret(userId, secret) {
        const [result] = await dbPromise.query(
            'UPDATE users SET totp_secret = ? WHERE id = ?',
            [secret, userId]
        );
        return result;
    },

    async enableTotp(userId) {
        const [result] = await dbPromise.query(
            'UPDATE users SET totp_enabled = TRUE WHERE id = ?',
            [userId]
        );
        return result;
    },

    async disableTotp(userId) {
        const [result] = await dbPromise.query(
            'UPDATE users SET totp_enabled = FALSE, totp_secret = NULL WHERE id = ?',
            [userId]
        );
        return result;
    },

    // ============================================================
    // PROFILE UPDATE
    // ============================================================

    async updateProfile(userId, { fullName, department }) {
        const [result] = await dbPromise.query(
            'UPDATE users SET full_name = ?, department = ? WHERE id = ?',
            [fullName, department, userId]
        );
        return result;
    }
};

module.exports = UserModel;
