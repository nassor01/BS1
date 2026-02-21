/**
 * Run Super Admin Migration
 * This script adds super_admin role to the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function runMigration() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database\n');

        // 1. Update role enum to include super_admin
        console.log('1. Updating users table role enum...');
        try {
            await connection.query(
                "ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user'"
            );
            console.log('   ✅ Role enum updated\n');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ✅ Role enum already updated\n');
            } else {
                throw err;
            }
        }

        // 2. Create audit_logs table
        console.log('2. Creating audit_logs table...');
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    action VARCHAR(100) NOT NULL,
                    entity_type VARCHAR(50),
                    entity_id INT,
                    old_value JSON,
                    new_value JSON,
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_user_id (user_id),
                    INDEX idx_action (action),
                    INDEX idx_entity (entity_type, entity_id),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ audit_logs table created\n');
        } catch (err) {
            console.log('   ✅ audit_logs table already exists\n');
        }

        // 3. Create system_settings table
        console.log('3. Creating system_settings table...');
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT,
                    description VARCHAR(255),
                    updated_by INT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_setting_key (setting_key)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ system_settings table created\n');
        } catch (err) {
            console.log('   ✅ system_settings table already exists\n');
        }

        // 4. Insert default settings
        console.log('4. Inserting default system settings...');
        try {
            await connection.query(`
                INSERT INTO system_settings (setting_key, setting_value, description) VALUES
                ('working_hours_start', '08:00', 'Default booking start time'),
                ('working_hours_end', '18:00', 'Default booking end time'),
                ('maintenance_mode', 'false', 'System maintenance mode flag'),
                ('require_email_verification', 'true', 'Require email verification for new users'),
                ('max_booking_days_ahead', '30', 'Maximum days in advance for bookings'),
                ('enable_multi_date_reservation', 'true', 'Allow multi-date reservations')
                ON DUPLICATE KEY UPDATE setting_key = setting_key
            `);
            console.log('   ✅ Default settings inserted\n');
        } catch (err) {
            console.log('   ✅ Default settings already exist\n');
        }

        // 5. Create admin_actions table
        console.log('5. Creating admin_actions table...');
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS admin_actions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id INT NOT NULL,
                    action_type VARCHAR(50) NOT NULL,
                    target_type VARCHAR(50),
                    target_id INT,
                    details JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_admin_id (admin_id),
                    INDEX idx_action_type (action_type),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('   ✅ admin_actions table created\n');
        } catch (err) {
            console.log('   ✅ admin_actions table already exists\n');
        }

        // Check current users with super_admin role
        console.log('6. Checking for existing super admins...');
        const [users] = await connection.query(
            "SELECT id, email, full_name, role FROM users WHERE role = 'super_admin'"
        );
        
        if (users.length > 0) {
            console.log('   Found super admin(s):');
            users.forEach(u => console.log(`   - ${u.email} (${u.full_name})`));
            console.log('');
        } else {
            console.log('   No super admin found.\n');
        }

        console.log('========================================');
        console.log('  Migration completed successfully!');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
