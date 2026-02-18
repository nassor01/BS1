const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const sessionManager = require('../services/sessionManager');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

/**
 * Two-Factor Authentication Controller
 * 
 * Implements TOTP (Time-based One-Time Password) using the speakeasy library.
 * Users can optionally enable 2FA for enhanced account security.
 * 
 * Security Impact: Adds a second layer of authentication, making accounts
 * significantly harder to compromise even if passwords are leaked.
 */
const twoFactorController = {

    /**
     * Setup 2FA - Generate secret and QR code
     * User must verify a code before 2FA is enabled
     */
    async setup(req, res) {
        try {
            const secret = speakeasy.generateSecret({
                name: `SwahiliPot Hub (${req.user.email})`,
                issuer: 'SwahiliPot Hub',
                length: 32
            });

            // Store the secret temporarily (not enabled yet)
            await UserModel.setTotpSecret(req.user.id, secret.base32);

            // Generate QR code as data URL
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            res.json({
                message: 'Scan the QR code with your authenticator app, then verify a code to enable 2FA.',
                qrCode: qrCodeUrl,
                manualKey: secret.base32,
                otpauthUrl: secret.otpauth_url
            });
        } catch (error) {
            console.error('2FA setup error:', error);
            res.status(500).json({ error: '2FA setup failed' });
        }
    },

    /**
     * Verify and enable 2FA
     * User submits a TOTP code to confirm setup
     */
    async enable(req, res) {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'TOTP code is required' });
        }

        try {
            const users = await UserModel.findById(req.user.id);
            if (!users.length || !users[0].totp_secret) {
                return res.status(400).json({ error: 'Please set up 2FA first' });
            }

            const verified = speakeasy.totp.verify({
                secret: users[0].totp_secret,
                encoding: 'base32',
                token: code,
                window: 1 // Allow 30 seconds clock drift
            });

            if (!verified) {
                return res.status(400).json({ error: 'Invalid TOTP code. Please try again.' });
            }

            await UserModel.enableTotp(req.user.id);
            console.log(`✅ 2FA enabled for user: ${req.user.email}`);

            res.json({ message: '2FA enabled successfully. Your account is now more secure.' });
        } catch (error) {
            console.error('2FA enable error:', error);
            res.status(500).json({ error: '2FA enable failed' });
        }
    },

    /**
     * Disable 2FA
     * Requires current TOTP code for security
     */
    async disable(req, res) {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'TOTP code is required to disable 2FA' });
        }

        try {
            const users = await UserModel.findById(req.user.id);
            if (!users.length || !users[0].totp_enabled) {
                return res.status(400).json({ error: '2FA is not enabled on this account' });
            }

            const verified = speakeasy.totp.verify({
                secret: users[0].totp_secret,
                encoding: 'base32',
                token: code,
                window: 1
            });

            if (!verified) {
                return res.status(400).json({ error: 'Invalid TOTP code' });
            }

            await UserModel.disableTotp(req.user.id);
            console.log(`⚠️  2FA disabled for user: ${req.user.email}`);

            res.json({ message: '2FA disabled successfully.' });
        } catch (error) {
            console.error('2FA disable error:', error);
            res.status(500).json({ error: '2FA disable failed' });
        }
    },

    /**
     * Verify a TOTP code (used during login if 2FA is enabled)
     * This accepts a temporary token (from first step of login) and returns full access tokens
     */
    async verify(req, res) {
        const { code, tempToken } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'TOTP Code is required' });
        }

        // If tempToken is provided, it's the login flow
        if (tempToken) {
            try {
                // Verify temp token
                const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

                if (decoded.role !== '2fa_pending') {
                    return res.status(401).json({ error: 'Invalid token type for 2FA verification' });
                }

                const userId = decoded.userId;

                const users = await UserModel.findById(userId);
                if (!users.length || !users[0].totp_enabled) {
                    return res.status(400).json({ error: '2FA is not enabled for this account' });
                }

                const verified = speakeasy.totp.verify({
                    secret: users[0].totp_secret,
                    encoding: 'base32',
                    token: code,
                    window: 1
                });

                if (!verified) {
                    return res.status(401).json({ error: 'Invalid 2FA code' });
                }

                // Generate full tokens
                const user = users[0];
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                sessionManager.addSession(user.id, {
                    userId: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                });

                console.log(`✅ 2FA verified, logging in: ${user.email}`);

                return res.json({
                    message: '2FA verified successfully',
                    verified: true,
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.full_name,
                        department: user.department,
                        role: user.role,
                        emailVerified: !!user.email_verified,
                        totpEnabled: !!user.totp_enabled
                    }
                });
            } catch (error) {
                console.error('2FA verify error:', error);
                if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Session expired. Please login again.' });
                }
                return res.status(500).json({ error: '2FA verification failed' });
            }
        }

        // Fallback for simple verification (e.g. re-verifying inside settings)
        // If no tempToken, assume user is authenticated (req.user exists via middleware)
        if (req.user && req.user.id) {
            try {
                const users = await UserModel.findById(req.user.id);
                if (!users.length) return res.status(404).json({ error: 'User not found' });

                const verified = speakeasy.totp.verify({
                    secret: users[0].totp_secret,
                    encoding: 'base32',
                    token: code,
                    window: 1
                });

                if (verified) {
                    return res.json({ message: 'Verified', verified: true });
                } else {
                    return res.status(401).json({ error: 'Invalid 2FA code' });
                }
            } catch (err) {
                return res.status(500).json({ error: 'Verification error' });
            }
        }

        return res.status(400).json({ error: 'Verification context missing (login or authenticated session)' });
    }
};

module.exports = twoFactorController;
