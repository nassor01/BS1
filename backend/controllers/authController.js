const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const sendMail = require('../utils/mailer');

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: 'swahilipot-hub',
            audience: 'swahilipot-users'
        }
    );
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { 
            expiresIn: '7d',
            issuer: 'swahilipot-hub',
            audience: 'swahilipot-users'
        }
    );
};

const authController = {
    // SIGNUP
    async signup(req, res) {
        const { email, password, fullName, department } = req.body;

        // Check if email is admin email
        if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
            return res.status(403).json({ error: 'Cannot use admin email for signup' });
        }

        try {
            // Check if user already exists
            const existing = await UserModel.findByEmail(email);

            if (existing.length > 0) {
                return res.status(409).json({ error: 'Email already registered' });
            }

            // Hash password with increased rounds for better security
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert new user
            const result = await UserModel.create(email, passwordHash, fullName, department);

            console.log(`✅ New user registered: ${email}`);

            // Prepare user object for token generation
            const newUser = {
                id: result.insertId,
                email: email,
                role: 'user'
            };

            // Generate tokens
            const accessToken = generateAccessToken(newUser);
            const refreshToken = generateRefreshToken(newUser);

            // Send welcome email (don't wait for it)
            sendMail(
                email,
                'Welcome to SwahiliPot Hub Booking System!',
                `Hello ${fullName},\n\nWelcome to SwahiliPot Hub Room Booking System! You can now book rooms for your meetings and events.\n\nBest regards,\nSwahiliPot Hub Team`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0B4F6C;">Welcome to SwahiliPot Hub!</h2>
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>Welcome to SwahiliPot Hub Room Booking System! You can now book rooms for your meetings and events.</p>
                    <p>Get started by logging in and exploring the available rooms.</p>
                    <br>
                    <p>Best regards,<br><strong>SwahiliPot Hub Team</strong></p>
                </div>
                `
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: newUser.id,
                    email: email,
                    fullName: fullName,
                    department: department,
                    role: 'user'
                },
                accessToken,
                refreshToken
            });

        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },

    // LOGIN
    async login(req, res) {
        const { email, password } = req.body;

        try {
            const results = await UserModel.findByEmail(email);

            if (results.length === 0) {
                // Use same error message as wrong password to prevent email enumeration
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            // Compare password
            const match = await bcrypt.compare(password, user.password_hash);

            if (match) {
                console.log(`✅ User logged in: ${user.email}`);

                // Generate tokens
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                res.json({
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.full_name,
                        department: user.department,
                        role: user.role
                    },
                    accessToken,
                    refreshToken
                });
            } else {
                res.status(401).json({ error: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    // REFRESH TOKEN
    async refreshToken(req, res) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(
                refreshToken, 
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
            );

            // Get user from database to ensure they still exist
            const results = await UserModel.findByEmail(decoded.email);

            if (results.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const user = results[0];

            // Generate new access token
            const newAccessToken = generateAccessToken(user);

            res.json({
                message: 'Token refreshed successfully',
                accessToken: newAccessToken
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid refresh token' });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Refresh token expired. Please login again.' });
            }

            console.error('Token refresh error:', error);
            res.status(500).json({ error: 'Token refresh failed' });
        }
    },

    // GET CURRENT USER (Protected route)
    async getCurrentUser(req, res) {
        try {
            // req.user is set by authenticate middleware
            const results = await UserModel.findByEmail(req.user.email);

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = results[0];

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    department: user.department,
                    role: user.role,
                    createdAt: user.created_at
                }
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to fetch user data' });
        }
    }
};

module.exports = authController;
