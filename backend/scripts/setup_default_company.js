const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function setup() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'vhop_db'
        });

        console.log('Connected to database...');
        
        await conn.execute("INSERT IGNORE INTO companies (id, name, city, verified) VALUES ('vhop_official', 'Global Admin', 'Mumbai', 1)");
        
        console.log('Default "vhop_official" company ensured in database.');
        await conn.end();
    } catch (error) {
        console.error('Error during setup:', error);
    }
}

setup();
