require('dotenv').config();
const mysql = require('mysql2');

const isProduction = process.env.NODE_ENV === 'production';
const DB_CONNECTION_LIMIT = isProduction 
    ? (process.env.DB_CONNECTION_LIMIT || 25) 
    : 5;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: DB_CONNECTION_LIMIT,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const dbPromise = db.promise();

// Test connection on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('   Please ensure:');
        console.error('   1. MySQL server is running');
        console.error('   2. Database "' + process.env.DB_NAME + '" exists');
        console.error('   3. Credentials in .env are correct');
    } else {
        console.log(`✅ Database connected (Pool: ${DB_CONNECTION_LIMIT})`);
        connection.release();
    }
});

// Handle connection errors after startup
db.on('error', (err) => {
    console.error('❌ Database pool error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('   Database connection was lost. Attempting to reconnect...');
    }
});

module.exports = { db, dbPromise };
