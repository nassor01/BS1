const { dbPromise } = require('./config/db');

async function fixBookingsTable() {
    try {
        console.log('🔄 Fixing bookings table schema...');

        // 1. Add missing columns
        const addColumnsQueries = [
            'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS type ENUM("booking", "reservation") DEFAULT "booking" AFTER end_time',
            'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500) AFTER status',
            'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL',
            'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS category ENUM("meeting", "event", "training", "co-working", "other") DEFAULT "meeting"'
        ];

        for (const query of addColumnsQueries) {
            try {
                await dbPromise.query(query);
                console.log(`✅ Executed: ${query.substring(0, 50)}...`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists, skipping.`);
                } else {
                    throw err;
                }
            }
        }

        // 2. Update status enum to include 'rejected'
        console.log('🔄 Updating status enum...');
        await dbPromise.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'rejected') DEFAULT 'pending'");
        console.log('✅ Status enum updated to include "rejected"');

        console.log('✨ Database fix completed successfully!');
    } catch (error) {
        console.error('❌ Failed to fix database:', error);
    } finally {
        process.exit();
    }
}

fixBookingsTable();
