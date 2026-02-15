const { dbPromise } = require('../config/db');

const UserModel = {
    async findByEmail(email) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows;
    },

    async create(email, passwordHash, fullName, department, role = 'user') {
        const [result] = await dbPromise.query(
            'INSERT INTO users (email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, fullName, department || null, role]
        );
        return result;
    }
};

module.exports = UserModel;
