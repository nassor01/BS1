#!/usr/bin/env node

/**
 * Create Super Admin Script
 * 
 * Usage:
 *   node scripts/create-super-admin.js
 * 
 * This script will:
 *   1. Check if a super admin already exists
 *   2. Prompt for email (or use command line argument)
 *   3. Create or promote the user to super_admin
 */

const readline = require('readline');
const bcrypt = require('bcrypt');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const emailArg = args[0];
const nameArg = args[1];
const passwordArg = args[2];

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { dbPromise } = require('../config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n========================================');
console.log('  Super Admin Creation Tool');
console.log('========================================\n');

async function createSuperAdmin() {
    let db;
    try {
        db = await dbPromise;
        
        // Check if super admin exists
        const [existing] = await db.query(
            "SELECT id, email, full_name, role FROM users WHERE role = 'super_admin'"
        );
        
        if (existing.length > 0) {
            console.log('A Super Admin already exists:');
            console.log(`  Email: ${existing[0].email}`);
            console.log(`  Name: ${existing[0].full_name}`);
            console.log('');
            
            // If arguments provided, ask to create another
            if (emailArg && passwordArg) {
                rl.question('Do you want to create another super admin? (y/n): ', async (answer) => {
                    if (answer.toLowerCase() !== 'y') {
                        console.log('\nOperation cancelled.');
                        process.exit(0);
                    }
                    await promptAndCreate(db);
                });
            } else {
                console.log('Run with arguments to create a new one:');
                console.log('  node create-super-admin.js <email> <name> <password>');
                process.exit(0);
            }
        } else {
            console.log('No super admin found. Let\'s create one.\n');
            await promptAndCreate(db);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function promptAndCreate(db) {
    // If command line arguments provided, use them
    if (emailArg && passwordArg) {
        const email = emailArg.trim().toLowerCase();
        const fullName = nameArg ? nameArg.trim() : 'Super Admin';
        const password = passwordArg;
        
        if (!email || !email.includes('@')) {
            console.log('Invalid email address.');
            process.exit(1);
        }
        
        await createOrPromoteUser(db, email, fullName, password);
    } else {
        // Interactive mode
        rl.question('Enter email for Super Admin: ', async (email) => {
            email = email.trim().toLowerCase();
            
            if (!email || !email.includes('@')) {
                console.log('Invalid email address.');
                process.exit(1);
            }
            
            // Check if user exists
            const [users] = await db.query(
                'SELECT id, email, full_name, role FROM users WHERE email = ?',
                [email]
            );
            
            if (users.length > 0) {
                const user = users[0];
                console.log(`\nUser found:`);
                console.log(`  Name: ${user.full_name}`);
                console.log(`  Email: ${user.email}`);
                console.log(`  Current Role: ${user.role}`);
                console.log('');
                
                rl.question('Promote this user to Super Admin? (y/n): ', async (answer) => {
                    if (answer.toLowerCase() === 'y') {
                        try {
                            await db.query(
                                'UPDATE users SET role = ? WHERE id = ?',
                                ['super_admin', user.id]
                            );
                            
                            console.log('\n========================================');
                            console.log('  SUCCESS!');
                            console.log('========================================');
                            console.log(`  User promoted to Super Admin`);
                            console.log(`  Email: ${email}`);
                            console.log('========================================\n');
                            
                            process.exit(0);
                        } catch (err) {
                            console.error('Failed to promote user:', err.message);
                            process.exit(1);
                        }
                    } else {
                        console.log('Operation cancelled.');
                        process.exit(0);
                    }
                });
            } else {
                console.log(`\nNo user found with email: ${email}`);
                console.log('Let\'s create a new Super Admin account.\n');
                
                rl.question('Enter full name: ', (fullName) => {
                    rl.question('Enter password: ', async (password) => {
                        if (!fullName || !password) {
                            console.log('Name and password are required.');
                            process.exit(1);
                        }
                        
                        await createOrPromoteUser(db, email, fullName, password);
                    });
                });
            }
        });
    }
}

async function createOrPromoteUser(db, email, fullName, password) {
    try {
        // Check if user already exists
        const [users] = await db.query(
            'SELECT id, email, full_name, role FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length > 0) {
            // Promote existing user
            await db.query(
                'UPDATE users SET role = ? WHERE id = ?',
                ['super_admin', users[0].id]
            );
            
            console.log('\n========================================');
            console.log('  SUCCESS!');
            console.log('========================================');
            console.log(`  User promoted to Super Admin`);
            console.log(`  Email: ${email}`);
            console.log('========================================\n');
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const [result] = await db.query(
                'INSERT INTO users (email, password_hash, full_name, role, email_verified) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, fullName, 'super_admin', true]
            );
            
            console.log('\n========================================');
            console.log('  SUCCESS!');
            console.log('========================================');
            console.log(`  Super Admin created successfully`);
            console.log(`  Email: ${email}`);
            console.log(`  Name: ${fullName}`);
            console.log('========================================\n');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to create user:', err.message);
        process.exit(1);
    }
}

// Handle ctrl+c
rl.on('close', () => {
    console.log('\nOperation cancelled.');
    process.exit(0);
});

createSuperAdmin();
