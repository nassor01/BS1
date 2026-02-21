-- Super Admin Migration
-- Run this file to add super_admin role and related tables

-- 1. Update role enum to include super_admin
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user';

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL COMMENT 'e.g., USER_PROMOTED, ROOM_DELETED',
    entity_type VARCHAR(50) COMMENT 'user, room, booking, setting',
    entity_id INT,
    old_value JSON COMMENT 'Previous state',
    new_value JSON COMMENT 'New state',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('working_hours_start', '08:00', 'Default booking start time'),
('working_hours_end', '18:00', 'Default booking end time'),
('maintenance_mode', 'false', 'System maintenance mode flag'),
('require_email_verification', 'true', 'Require email verification for new users'),
('max_booking_days_ahead', '30', 'Maximum days in advance for bookings'),
('enable_multi_date_reservation', 'true', 'Allow multi-date reservations')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- 5. Create Admin Actions Table
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) COMMENT 'user, room, booking',
    target_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Super Admin migration completed successfully!' AS message;
