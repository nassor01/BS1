const { dbPromise } = require('./config/db');

async function testQuery() {
    try {
        const userId = 19; // From the user's error message /bookings/user/19
        console.log(`Testing query for userId: ${userId}`);

        const [rows] = await dbPromise.query(
            `SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.type,
                b.status,
                b.cancellation_reason,
                b.created_at,
                r.name as room_name,
                r.space,
                r.capacity
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC`,
            [userId]
        );

        console.log('Query successful!');
        console.log(`Found ${rows.length} rows.`);
    } catch (error) {
        console.error('Query failed!');
        console.error(error);
    } finally {
        process.exit();
    }
}

testQuery();
