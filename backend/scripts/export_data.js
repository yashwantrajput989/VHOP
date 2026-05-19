const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

async function dumpData() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'vhop_db'
        });

        const tables = ['profiles', 'companies', 'events', 'bookings'];
        let sqlDump = '\n\n-- Mock Data Dump\n';

        for (const table of tables) {
            const [rows] = await conn.execute(`SELECT * FROM ${table}`);
            if (rows.length === 0) continue;

            sqlDump += `\n-- Data for table ${table}\n`;
            for (const row of rows) {
                const keys = Object.keys(row);
                const values = Object.values(row).map(val => {
                    if (val === null) return 'NULL';
                    if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                    return val;
                });

                sqlDump += `INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
        }

        const setupFilePath = path.join(__dirname, '..', 'db_setup.sql');
        const currentSetup = fs.readFileSync(setupFilePath, 'utf8');
        
        // Remove old mock data if exists to prevent duplicates in the file
        const cleanedSetup = currentSetup.split('-- Mock Data Dump')[0].trim();
        
        fs.writeFileSync(setupFilePath, cleanedSetup + '\n' + sqlDump);
        
        console.log('db_setup.sql updated with current database data.');
        await conn.end();
    } catch (error) {
        console.error('Error dumping data:', error);
    }
}

dumpData();
