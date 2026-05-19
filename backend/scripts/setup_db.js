const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
    console.log('🚀 Starting Local Database Setup...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        const sqlPath = path.join(__dirname, '../db_setup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📁 Reading db_setup.sql...');
        await connection.query(sql);

        console.log('✅ Database and Tables created successfully!');
        
        // Seed initial company data for testing if needed
        console.log('🌱 Seeding initial test data...');
        
        // 1. Create a test profile (Admin)
        const adminId = 'test-admin-123';
        await connection.query(`
            INSERT IGNORE INTO profiles (id, full_name, username, email, role) 
            VALUES (?, 'Demo Admin', 'demoadmin', 'admin@vhop.in', 'admin')
        `, [adminId]);

        // 2. Create a test company
        await connection.query(`
            INSERT IGNORE INTO companies (id, name, admin_user_id, city, verified, description) 
            VALUES ('comp_test_1', 'VHOP Events Mumbai', ?, 'Mumbai', true, 'The official demo company for testing.')
        `, [adminId]);

        console.log('✨ Setup complete! You can now start the backend.');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        await connection.end();
    }
}

setupDatabase();
