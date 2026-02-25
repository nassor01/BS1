const { dbPromise } = require('./config/db');

async function checkSchema() {
    try {
        console.log('Checking bookings table structure...');
        const [rows] = await dbPromise.query('DESCRIBE bookings');
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Failed to describe table:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
