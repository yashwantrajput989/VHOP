const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vhop_db'
    });

    try {
        const [rows] = await connection.query('DESCRIBE profiles');
        console.table(rows);
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();
