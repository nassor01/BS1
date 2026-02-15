const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
const sendMail = require('../utils/mailer');

const authController = {
    // SIGNUP
    async signup(req, res) {
        const { email, password, fullName, department } = req.body;

        // Validate required fields
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

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

            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert new user
            const result = await UserModel.create(email, passwordHash, fullName, department);

            console.log(`✅ New user registered: ${email}`);

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
                userId: result.insertId
            });

        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },

    // LOGIN
    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        try {
            const results = await UserModel.findByEmail(email);

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            // Compare password
            const match = await bcrypt.compare(password, user.password_hash);

            if (match) {
                console.log(`✅ User logged in: ${user.email}`);

                res.json({
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.full_name,
                        department: user.department,
                        role: user.role
                    }
                });
            } else {
                res.status(401).json({ error: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
};

module.exports = authController;
