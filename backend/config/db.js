require('dotenv').config();
const mysql = require('mysql2');

const DB_CONNECTION_LIMIT = process.env.DB_CONNECTION_LIMIT || 25;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: DB_CONNECTION_LIMIT,
    queueLimit: 0
});

const dbPromise = db.promise();

db.on('connection', (connection) => {
    console.log(`🔗 New database connection: ${connection.threadId}`);
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log(`✅ Database connected successfully (Pool size: ${DB_CONNECTION_LIMIT})`);
        connection.release();
    }
});

module.exports = { db, dbPromise };
