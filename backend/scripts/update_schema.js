const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateSchema() {
    console.log('🛠 Updating Database Schema...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vhop_db'
    });

    try {
        console.log('Adding onboarded column...');
        try {
            await connection.query('ALTER TABLE profiles ADD COLUMN onboarded BOOLEAN DEFAULT FALSE');
        } catch (e) { console.log('onboarded column might already exist'); }

        console.log('Adding interests column...');
        try {
            await connection.query('ALTER TABLE profiles ADD COLUMN interests JSON AFTER onboarded');
        } catch (e) { console.log('interests column might already exist'); }

        console.log('✅ Schema updated successfully!');
    } catch (error) {
        console.error('❌ Update failed:', error);
    } finally {
        await connection.end();
    }
}

updateSchema();
