const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const multer = require('multer');
const { 
    sendBookingEmail, 
    sendResetEmail, 
    sendPartnerReceiptEmail, 
    sendPartnerNotificationToSuperEmail, 
    sendPartnerApprovalCredentialsEmail,
    sendContactFormDetailsToSuperEmail
} = require('./utils/email');
const { sendSMS, sendBulkSMS, buildBookingConfirmationSMS } = require('./utils/sms');
// Razorpay import removed - using Cashfree now
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;



// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vhop_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ensure profiles, companies, events, bookings, and visitors tables exist, and perform necessary migrations
(async () => {
    try {
        // 1. Verify/Create profiles table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS profiles (
                id VARCHAR(255) PRIMARY KEY,
                full_name VARCHAR(255),
                username VARCHAR(255) UNIQUE,
                email VARCHAR(255) UNIQUE,
                avatar_url MEDIUMTEXT,
                role ENUM('user', 'admin', 'superadmin') DEFAULT 'user',
                v_coins INT DEFAULT 100,
                city VARCHAR(100) DEFAULT 'Mumbai',
                phone VARCHAR(20),
                gender VARCHAR(20) NULL,
                onboarded BOOLEAN DEFAULT FALSE,
                interests JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('🟢 Profiles table verified/created.');

        // 2. Verify/Create companies table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS companies (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                admin_user_id VARCHAR(255),
                city VARCHAR(100),
                description TEXT,
                website VARCHAR(255),
                contact_email VARCHAR(255),
                phone VARCHAR(20),
                payout_upi VARCHAR(255),
                verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES profiles(id)
            )
        `);
        console.log('🟢 Companies table verified/created.');

        // 3. Verify/Create events table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(255) PRIMARY KEY,
                company_id VARCHAR(255),
                title VARCHAR(255) NOT NULL,
                short_description TEXT,
                description TEXT,
                venue_name VARCHAR(255),
                city VARCHAR(100),
                category VARCHAR(50),
                price DECIMAL(10, 2),
                cover_image MEDIUMTEXT,
                start_date DATETIME,
                end_date DATETIME,
                status ENUM('draft', 'published', 'completed', 'cancelled') DEFAULT 'draft',
                tickets_sold INT DEFAULT 0,
                ticket_types JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id)
            )
        `);
        console.log('🟢 Events table verified/created.');

        // 4. Verify/Create bookings table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(255) PRIMARY KEY,
                event_id VARCHAR(255),
                user_id VARCHAR(255),
                quantity INT,
                total_amount DECIMAL(10, 2),
                ticket_name VARCHAR(255),
                price DECIMAL(10, 2),
                payment_id VARCHAR(255),
                payment_status VARCHAR(50),
                booking_status VARCHAR(50) DEFAULT 'confirmed',
                booking_id VARCHAR(50),
                qr_code TEXT,
                guests JSON,
                booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id),
                FOREIGN KEY (user_id) REFERENCES profiles(id)
            )
        `);
        console.log('🟢 Bookings table verified/created.');

        // 5. Verify/Create visitors table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS visitors (
                id VARCHAR(255) PRIMARY KEY,
                admin_id VARCHAR(255) NOT NULL,
                visitor_name VARCHAR(255) NOT NULL,
                age INT,
                phone VARCHAR(20),
                email VARCHAR(255),
                address TEXT,
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('🟢 Visitors table verified/created.');

        // 5b. Verify/Create support_messages table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS support_messages (
                id VARCHAR(255) PRIMARY KEY,
                admin_id VARCHAR(255) NOT NULL,
                sender_id VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
        `);
        console.log('🟢 Support messages table verified/created.');

        // 5c. Verify/Create partner_applications table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS partner_applications (
                id VARCHAR(255) PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                company_city VARCHAR(100) NOT NULL,
                description TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('🟢 Partner applications table verified/created.');

        // 5d. Verify/Create contact_messages table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('🟢 Contact messages table verified/created.');

        // 5e. Verify/Create coupons table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS coupons (
                code VARCHAR(50) PRIMARY KEY,
                discount_type ENUM('fixed', 'percentage', 'fixed_price') NOT NULL,
                discount_value DECIMAL(10, 2) NOT NULL,
                min_purchase DECIMAL(10, 2) DEFAULT 0.00,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('🟢 Coupons table verified/created.');

        // Seed default coupons (using INSERT IGNORE for safety in production)
        await pool.execute(`
            INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_purchase, active)
            VALUES 
            ('RUPEE1', 'fixed_price', 1.00, 0.00, true),
            ('SAVE99', 'fixed', 99.00, 100.00, true)
        `);
        console.log('🟢 Default coupons seeded/verified.');

        // 5f. Verify/Create system_settings table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value VARCHAR(255) NOT NULL
            )
        `);
        console.log('🟢 System settings table verified/created.');

        // Seed default system fees (using INSERT IGNORE for safety in production)
        await pool.execute(`
            INSERT IGNORE INTO system_settings (setting_key, setting_value)
            VALUES 
            ('platform_fee', '0'),
            ('gst_rate', '0'),
            ('high_demand_fee', '0')
        `);
        console.log('🟢 Default fee settings seeded/verified.');

        // 5g. Verify/Create genre_fees table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS genre_fees (
                genre VARCHAR(100) PRIMARY KEY,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00
            )
        `);
        console.log('🟢 Genre fees table verified/created.');

        // 5h. Verify/Create sms_templates table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS sms_templates (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                body TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('🟢 SMS templates table verified/created.');

        // Seed default SMS templates
        await pool.execute(`
            INSERT IGNORE INTO sms_templates (id, name, body)
            VALUES
            ('tpl_booking', 'Booking Confirmation', 'Hi {{name}}! Your VHOP ticket for {{event}} is confirmed. Booking ID: {{booking_id}}. Venue: {{venue}}. Date: {{date}}. See you there! 🎶'),
            ('tpl_reminder', 'Event Reminder', 'Hi {{name}}! Just a reminder – {{event}} is happening tomorrow at {{venue}}. Get ready for an amazing night! 🎉'),
            ('tpl_offer', 'Promo / Offer', 'Hey {{name}}! Exclusive offer from VHOP: Get 20% off on your next booking. Use code VHOP20 at checkout. Limited time only!')
        `);
        console.log('🟢 Default SMS templates seeded/verified.');



        // 6. Check existing columns in profiles table (database-agnostic method)
        const [columns] = await pool.execute('DESCRIBE profiles');
        const existingColumns = columns.map(c => c.Field.toLowerCase());

        // Alter profile and event tables to support Base64 images without truncation
        try {
            await pool.execute('ALTER TABLE profiles MODIFY COLUMN avatar_url MEDIUMTEXT');
            console.log('🟢 Profiles avatar_url column modified to MEDIUMTEXT.');
        } catch (err) {
            console.error('🔴 Error altering profiles.avatar_url:', err);
        }

        try {
            await pool.execute('ALTER TABLE events MODIFY COLUMN cover_image MEDIUMTEXT');
            console.log('🟢 Events cover_image column modified to MEDIUMTEXT.');
        } catch (err) {
            console.error('🔴 Error altering events.cover_image:', err);
        }

        const addColumnIfNeeded = async (columnName, columnDefinition) => {
            if (!existingColumns.includes(columnName.toLowerCase())) {
                try {
                    await pool.execute(`ALTER TABLE profiles ADD COLUMN ${columnName} ${columnDefinition}`);
                    console.log(`🟢 Added missing column: profiles.${columnName}`);
                } catch (alterErr) {
                    console.error(`🔴 Error adding profiles.${columnName} column:`, alterErr);
                }
            } else {
                console.log(`🟢 Column profiles.${columnName} is verified/ready.`);
            }
        };

        // Modify the role ENUM if subadmin is missing
        const roleCol = columns.find(c => c.Field.toLowerCase() === 'role');
        if (roleCol && !roleCol.Type.toLowerCase().includes('subadmin')) {
            try {
                await pool.execute("ALTER TABLE profiles MODIFY COLUMN role ENUM('user', 'admin', 'superadmin', 'subadmin') DEFAULT 'user'");
                console.log("🟢 Updated role ENUM to include 'subadmin'.");
            } catch (enumErr) {
                console.error("🔴 Error altering role ENUM:", enumErr);
            }
        }

        // Verify required columns in profiles
        await addColumnIfNeeded('password', 'VARCHAR(255) NULL');
        await addColumnIfNeeded('age', 'INT NULL');
        await addColumnIfNeeded('address', 'TEXT NULL');
        await addColumnIfNeeded('gender', 'VARCHAR(20) NULL');
        await addColumnIfNeeded('birthday', 'VARCHAR(50) NULL');
        await addColumnIfNeeded('v_coins_rewarded', 'BOOLEAN DEFAULT FALSE');
        await addColumnIfNeeded('referred_by', 'VARCHAR(255) NULL');
        await addColumnIfNeeded('referral_rewarded', 'BOOLEAN DEFAULT FALSE');
        await addColumnIfNeeded('parent_admin_id', 'VARCHAR(255) NULL');
        await addColumnIfNeeded('streak_count', 'INT DEFAULT 0');
        await addColumnIfNeeded('streak_updated_at', 'TIMESTAMP NULL DEFAULT NULL');
        await addColumnIfNeeded('last_action_date', 'TIMESTAMP NULL DEFAULT NULL');
        await addColumnIfNeeded('nights_out', 'INT DEFAULT 0');
        await addColumnIfNeeded('referred_count', 'INT DEFAULT 0');
        await addColumnIfNeeded('aadhaar_verified', 'BOOLEAN DEFAULT FALSE');
        await addColumnIfNeeded('vip_tier', "VARCHAR(50) DEFAULT 'Regular'");
        await addColumnIfNeeded('music_dna_edm', 'INT DEFAULT 72');
        await addColumnIfNeeded('music_dna_bollywood', 'INT DEFAULT 18');
        await addColumnIfNeeded('music_dna_live', 'INT DEFAULT 10');
        await addColumnIfNeeded('reset_token', 'VARCHAR(255) NULL');
        await addColumnIfNeeded('reset_token_expires', 'TIMESTAMP NULL DEFAULT NULL');

        // Create phone_otps table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS phone_otps (
                phone VARCHAR(20) PRIMARY KEY,
                otp_code VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL
            )
        `);
        console.log('🟢 Phone OTPs table verified/created.');

        // Verify required columns in events
        const [eventColumns] = await pool.execute('DESCRIBE events');
        const existingEventColumns = eventColumns.map(c => c.Field.toLowerCase());

        const addEventColumnIfNeeded = async (columnName, columnDefinition) => {
            if (!existingEventColumns.includes(columnName.toLowerCase())) {
                try {
                    await pool.execute(`ALTER TABLE events ADD COLUMN ${columnName} ${columnDefinition}`);
                    console.log(`🟢 Added missing column: events.${columnName}`);
                } catch (alterErr) {
                    console.error(`🔴 Error adding events.${columnName} column:`, alterErr);
                }
            } else {
                console.log(`🟢 Column events.${columnName} is verified/ready.`);
            }
        };

        await addEventColumnIfNeeded('google_maps_url', 'TEXT NULL');
        await addEventColumnIfNeeded('artists', 'JSON NULL');

        // Verify required columns in bookings
        const [bookingColumns] = await pool.execute('DESCRIBE bookings');
        const existingBookingColumns = bookingColumns.map(c => c.Field.toLowerCase());

        const addBookingColumnIfNeeded = async (columnName, columnDefinition) => {
            if (!existingBookingColumns.includes(columnName.toLowerCase())) {
                try {
                    await pool.execute(`ALTER TABLE bookings ADD COLUMN ${columnName} ${columnDefinition}`);
                    console.log(`🟢 Added missing column: bookings.${columnName}`);
                } catch (alterErr) {
                    console.error(`🔴 Error adding bookings.${columnName} column:`, alterErr);
                }
            } else {
                console.log(`🟢 Column bookings.${columnName} is verified/ready.`);
            }
        };

        await addBookingColumnIfNeeded('coupon_code', 'VARCHAR(50) NULL');
        await addBookingColumnIfNeeded('discount_amount', 'DECIMAL(10, 2) DEFAULT 0.00');


        // 7. Seed default admin profile (using INSERT IGNORE for safety in production)
        await pool.execute(`
            INSERT IGNORE INTO profiles (id, full_name, username, email, password, role, v_coins, city, onboarded)
            VALUES ('test-admin-123', 'Demo Admin', 'demoadmin', 'admin@vhop.in', 'vhop1234', 'admin', 500, 'Mumbai', true)
        `);
        
        // Seed super admin profile (using INSERT IGNORE for safety in production) to resolve support messages foreign key constraint failures
        await pool.execute(`
            INSERT IGNORE INTO profiles (id, full_name, username, email, password, role, v_coins, city, onboarded)
            VALUES ('super-admin-root', 'Super Admin', 'superadmin', 'superadmin@vhop.in', 'vhop1234', 'superadmin', 99999, 'Mumbai', true)
        `);
        console.log('🟢 Demo admin and Super admin accounts seeded/verified.');

        // 8. Seed default verified company and admin company for events
        await pool.execute(`
            INSERT IGNORE INTO companies (id, name, admin_user_id, city, description, verified)
            VALUES ('comp_test_1', 'VHOP Events Mumbai', 'test-admin-123', 'Mumbai', 'The official demo company for testing.', true)
        `);
        await pool.execute(`
            INSERT IGNORE INTO companies (id, name, admin_user_id, city, description, verified)
            VALUES ('vhop_official', 'Global Admin', NULL, 'Mumbai', 'VHOP official organization.', true)
        `);
        console.log('🟢 Demo companies seeded/verified.');

        // 9. Seed multiple complete mock user profiles for scan simulator (using INSERT IGNORE for safety in production)
        const mockUsers = [
            { id: 'usr_demo_1', name: 'Kabir Sharma', username: 'kabir', email: 'kabir@gmail.com', phone: '+91 98765 43210', age: 24, address: 'Bandra West, Mumbai, MH' },
            { id: 'usr_demo_2', name: 'Riya Sen', username: 'riya', email: 'riya@yahoo.com', phone: '+91 98123 45678', age: 22, address: 'Jubilee Hills, Hyderabad, TS' },
            { id: 'usr_demo_3', name: 'Aarav Rajput', username: 'aarav', email: 'aarav@vhop.in', phone: '+91 99887 76655', age: 26, address: 'Gachibowli, Hyderabad, TS' }
        ];

        for (const u of mockUsers) {
            await pool.execute(`
                INSERT IGNORE INTO profiles (id, full_name, username, email, password, role, v_coins, city, phone, age, address, onboarded)
                VALUES (?, ?, ?, ?, 'user123', 'user', 100, 'Mumbai', ?, ?, ?, true)
            `, [u.id, u.name, u.username, u.email, u.phone, u.age, u.address]);
        }
        console.log('🟢 Mock user profiles seeded/verified for entry scan simulation.');

        // 10. Seed default events
        const mockEvents = [
            {
                id: 'ev_fxozfzr9f',
                company_id: 'vhop_official',
                title: 'Cyberpunk Rooftop Rave',
                short_description: 'A neon-drenched night of futuristic beats.',
                description: "Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We're taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀",
                venue_name: 'ma intlo ',
                city: 'Mumbai',
                category: 'Music',
                price: 1999.00,
                cover_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000',
                start_date: '2026-05-29 02:13:00',
                status: 'published',
                ticket_types: JSON.stringify([
                    { name: "vip", price: 888, benefits: ["hello ", "hi ", "bye"], id: "t-uy2b8d9" },
                    { name: "adukonodu", price: 9, benefits: ["bayita nuchoni chud", "lopalki oste tanesta", "dengey "], id: "t-219dvfs" },
                    { name: "super Vip ", price: 1000000, benefits: ["dj ni dengochu ", "waitress ochi notlo petkuntadi", "last lo happy ending "], id: "t-y7xm7c1" }
                ])
            },
            {
                id: 'ev_qm89d6v3d',
                company_id: 'vhop_official',
                title: 'Cyberpunk Rooftop Rave',
                short_description: 'A neon-drenched night of futuristic beats.',
                description: "Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We're taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀",
                venue_name: 'ma intlo ',
                city: 'Mumbai',
                category: 'Music',
                price: 1999.00,
                cover_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000',
                start_date: '2026-05-29 13:13:00',
                status: 'published',
                ticket_types: JSON.stringify([
                    { name: "vip", price: 888, benefits: ["hello ", "hi ", "bye"], id: "t-uy2b8d9" },
                    { name: "adukonodu", price: 9, benefits: ["bayita nuchoni chud", "lopalki oste tanesta", "dengey "], id: "t-219dvfs" },
                    { name: "super Vip ", price: 1000000, benefits: ["dj ni dengochu ", "waitress ochi notlo petkuntadi", "last lo happy ending "], id: "t-y7xm7c1" }
                ])
            },
            {
                id: 'ev_ysxehinrt',
                company_id: 'vhop_official',
                title: 'Cyberpunk Rooftop Rave',
                short_description: 'A neon-drenched night of futuristic beats.',
                description: "Get ready for the most immersive cyberpunk experience Mumbai has ever seen. We're taking over the highest rooftop in the city for a night of underground techno, interactive light installations, and synthwave vibes. 🌃🔊🚀",
                venue_name: 'ma intlo ',
                city: 'Visakhapatnam',
                category: 'Music',
                price: 1999.00,
                cover_image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000',
                start_date: '2026-05-28 15:13:00',
                status: 'published',
                ticket_types: JSON.stringify([
                    { name: "vip", price: 888, benefits: ["hello ", "hi ", "bye"], id: "t-uy2b8d9" },
                    { name: "adukonodu", price: 9, benefits: ["bayita nuchoni chud", "lopalki oste tanesta", "dengey "], id: "t-219dvfs" },
                    { name: "super Vip ", price: 1000000, benefits: ["dj ni dengochu ", "waitress ochi notlo petkuntadi", "last lo happy ending "], id: "t-y7xm7c1" }
                ])
            }
        ];

        for (const e of mockEvents) {
            await pool.execute(`
                INSERT IGNORE INTO events (id, company_id, title, short_description, description, venue_name, city, category, price, cover_image, start_date, status, ticket_types)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [e.id, e.company_id, e.title, e.short_description, e.description, e.venue_name, e.city, e.category, e.price, e.cover_image, e.start_date, e.status, e.ticket_types]);
        }
        console.log('🟢 Demo events seeded/verified.');

    } catch (err) {
        console.error('🔴 Database initialization error:', err);
    }
})();

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(cors({
    origin: [
        'https://vhop.in', 
        'https://www.vhop.in', 
        'http://localhost:5173',
        'http://localhost', 
        'capacitor://localhost'
    ], // Production, local dev, and native mobile apps (Capacitor)
    credentials: true
}));
app.use(express.json({ 
    limit: '50mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper to safely format profile rows (JSON parsing interests and boolean normalization)
function formatProfile(profile) {
    if (!profile) return null;
    const formatted = { ...profile };
    
    // Parse interests if it's a string, or initialize to empty array
    if (typeof formatted.interests === 'string') {
        try {
            formatted.interests = JSON.parse(formatted.interests);
        } catch (e) {
            formatted.interests = formatted.interests.split(',').map(s => s.trim()).filter(Boolean);
        }
    } else if (!formatted.interests) {
        formatted.interests = [];
    }
    
    // Normalize boolean status columns from TINYINT (0 or 1) to real boolean (true/false)
    formatted.onboarded = formatted.onboarded === 1 || formatted.onboarded === true;
    formatted.v_coins_rewarded = formatted.v_coins_rewarded === 1 || formatted.v_coins_rewarded === true;
    formatted.referral_rewarded = formatted.referral_rewarded === 1 || formatted.referral_rewarded === true;
    formatted.aadhaar_verified = formatted.aadhaar_verified === 1 || formatted.aadhaar_verified === true;
    
    return formatted;
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const activityLogPath = path.join(logsDir, 'activity.log');

// Helper to write to log file
const logActivity = (data) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(data)}\n`;
    fs.appendFileSync(activityLogPath, logEntry);
    console.log(`Logged: ${logEntry.trim()}`);
};

// Helper to resolve subadmin to parent admin ID
const resolveAdminUserId = async (userId) => {
    if (!userId) return userId;
    try {
        const [rows] = await pool.execute('SELECT parent_admin_id FROM profiles WHERE id = ?', [userId]);
        if (rows.length > 0 && rows[0].parent_admin_id) {
            return rows[0].parent_admin_id;
        }
    } catch (err) {
        console.error('Error resolving admin user ID:', err);
    }
    return userId;
};

// Helper to process referral reward (crediting 25 V-Coins to both invitee and referrer)
const processReferralReward = async (userId, referredByCode) => {
    if (!referredByCode || typeof referredByCode !== 'string') return;
    
    try {
        // Parse referred username from code (format: VHOP-USERNAME-2026)
        const parts = referredByCode.split('-');
        if (parts.length < 2 || parts[0] !== 'VHOP') {
            console.log(`[Referral] Invalid referral code format: ${referredByCode}`);
            return;
        }
        
        const referrerUsername = parts[1].toLowerCase();
        
        // Start a database connection from the pool to run in transaction
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // 1. Get invitee profile (to ensure they exist and aren't already rewarded)
            const [inviteeRows] = await connection.execute(
                'SELECT id, username, v_coins, referral_rewarded FROM profiles WHERE id = ?',
                [userId]
            );
            
            if (inviteeRows.length === 0) {
                console.log(`[Referral] Invitee profile not found for ID: ${userId}`);
                await connection.rollback();
                return;
            }
            
            const invitee = inviteeRows[0];
            if (invitee.referral_rewarded) {
                console.log(`[Referral] User ${userId} has already been rewarded for referral.`);
                await connection.rollback();
                return;
            }
            
            // 2. Find referrer by username (case-insensitive)
            const [referrerRows] = await connection.execute(
                'SELECT id, username, v_coins FROM profiles WHERE LOWER(username) = ?',
                [referrerUsername]
            );
            
            if (referrerRows.length === 0) {
                console.log(`[Referral] Referrer not found for username: ${referrerUsername}`);
                await connection.rollback();
                return;
            }
            
            const referrer = referrerRows[0];
            
            // Prevent self-referral
            if (referrer.id === userId || (invitee.username && referrer.username.toLowerCase() === invitee.username.toLowerCase())) {
                console.log(`[Referral] Self-referral detected for user ${userId}. Reward aborted.`);
                await connection.rollback();
                return;
            }
            
            // 3. Update invitee: +25 v_coins, set referred_by and referral_rewarded
            await connection.execute(
                'UPDATE profiles SET v_coins = v_coins + 25, referred_by = ?, referral_rewarded = true WHERE id = ?',
                [referrer.username, userId]
            );
            
            // 4. Update referrer: +25 v_coins, increment referred_count
            await connection.execute(
                'UPDATE profiles SET v_coins = v_coins + 25, referred_count = referred_count + 1 WHERE id = ?',
                [referrer.id]
            );

            // 5. Maintain weekly action streak for invitee and referrer
            await maintainWeeklyStreak(connection, userId);
            await maintainWeeklyStreak(connection, referrer.id);
            
            await connection.commit();
            console.log(`[Referral] Success! User ${userId} and Referrer ${referrer.id} (${referrer.username}) rewarded 25 V-Coins each.`);
            
            logActivity({
                type: 'referral_rewarded',
                inviteeId: userId,
                referrerId: referrer.id,
                referrerUsername: referrer.username,
                coinsCredited: 25
            });
            
        } catch (txErr) {
            await connection.rollback();
            throw txErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('[Referral] Error processing referral reward:', err);
    }
};

// Helper to maintain weekly action streak for users
const maintainWeeklyStreak = async (connection, userId) => {
    try {
        // Fetch current streak info
        const [rows] = await connection.execute(
            'SELECT streak_count, streak_updated_at, v_coins FROM profiles WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) return;

        const user = rows[0];
        const now = new Date();
        let streakCount = user.streak_count || 0;
        let streakUpdatedAt = user.streak_updated_at ? new Date(user.streak_updated_at) : null;
        let newVCoins = user.v_coins || 0;
        let awardReward = false;

        if (!streakUpdatedAt || streakCount === 0) {
            // First activity
            streakCount = 1;
            streakUpdatedAt = now;
        } else {
            const diffTime = Math.abs(now.getTime() - streakUpdatedAt.getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays >= 7 && diffDays < 14) {
                // Next week! Increment streak
                streakCount += 1;
                streakUpdatedAt = now;

                // Milestone: 5 weeks completed! Award them V-Coins
                if (streakCount === 5) {
                    newVCoins += 250; // Award 250 V-Coins!
                    awardReward = true;
                    console.log(`[Streak] User ${userId} completed a 5-week streak! Awarded 250 V-Coins.`);
                }
            } else if (diffDays >= 14) {
                // Streak broken! Reset to 1
                streakCount = 1;
                streakUpdatedAt = now;
            } else {
                // Already did an action this week. Update last action date, keep streak
            }
        }

        await connection.execute(
            'UPDATE profiles SET streak_count = ?, streak_updated_at = ?, last_action_date = ?, v_coins = ? WHERE id = ?',
            [streakCount, streakUpdatedAt, now, newVCoins, userId]
        );

        if (awardReward) {
            logActivity({
                type: 'streak_milestone_completed',
                userId,
                streakCount,
                coinsAwarded: 250
            });
        }
        
        console.log(`[Streak] Updated streak for user ${userId}: count=${streakCount}`);
    } catch (err) {
        console.error('[Streak] Error updating streak:', err);
    }
};

// --- FILE UPLOADS ---

// Single image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
});

// Sync Firebase Profile with MySQL
app.post('/api/auth/sync', async (req, res) => {
    const { id, full_name, username, email, avatar_url, role, v_coins, city, phone, birthday } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);

        if (rows.length === 0) {
            // Create new profile
            await pool.execute(
                'INSERT INTO profiles (id, full_name, username, email, avatar_url, role, v_coins, city, phone, birthday) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, full_name, username, email, avatar_url, role || 'user', v_coins || 500, city || 'Mumbai', phone || '', birthday || null]
            );
            logActivity({ type: 'profile_created', userId: id });
            return res.status(201).json({ message: 'Profile created', onboarded: false });
        } else {
            // Update existing profile
            await pool.execute(
                'UPDATE profiles SET full_name = ?, avatar_url = ?, city = ?, birthday = ? WHERE id = ?',
                [full_name, avatar_url, city, birthday || rows[0].birthday, id]
            );
            return res.status(200).json({
                message: 'Profile updated',
                onboarded: rows[0].onboarded === 1 || rows[0].onboarded === true
            });
        }
    } catch (error) {
        console.error('Error syncing profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile by ID to verify active session
app.get('/api/auth/profile/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.status(200).json(formatProfile(rows[0]));
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Register standard user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name, referred_by_code } = req.body;
    try {
        const [existing] = await pool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const id = `usr_${Math.random().toString(36).substring(2, 11)}`;
        const username = email.split('@')[0] || `user_${id}`;
        const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
        
        await pool.execute(
            'INSERT INTO profiles (id, full_name, username, email, password, avatar_url, role, v_coins, city, phone, streak_count, streak_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())',
            [id, full_name || 'New User', username, email, password || null, avatar_url, 'user', 500, 'Mumbai', '']
        );

        logActivity({ type: 'profile_created', userId: id });

        // Process referral if code is provided
        if (referred_by_code) {
            await processReferralReward(id, referred_by_code);
        }
        
        const [userRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);
        res.status(201).json(formatProfile(userRows[0]));
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login standard user
app.post('/api/auth/login', async (req, res) => {
    const { email, password, referred_by_code } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ error: 'No account found with this email' });
        }

        const userProfile = rows[0];
        if (userProfile.password !== password) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Process referral if code is provided and user has never been referred before
        if (referred_by_code && !userProfile.referral_rewarded) {
            await processReferralReward(userProfile.id, referred_by_code);
        }

        // If streak_count is 0 or null, start the streak from w1
        if (!userProfile.streak_count || userProfile.streak_count === 0) {
            await pool.execute(
                'UPDATE profiles SET streak_count = 1, streak_updated_at = NOW() WHERE id = ?',
                [userProfile.id]
            );
        }

        const [updatedRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userProfile.id]);
        res.status(200).json(formatProfile(updatedRows[0]));
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google Sign-in Sync/Simulated Login
app.post('/api/auth/google-login', async (req, res) => {
    const { email, full_name, avatar_url, id: googleId, referred_by_code, birthday } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (rows.length > 0) {
            const userProfile = rows[0];
            
            // Process referral if code is provided and user has never been referred before
            if (referred_by_code && !userProfile.referral_rewarded) {
                await processReferralReward(userProfile.id, referred_by_code);
            }

            // Update details if they changed
            await pool.execute(
                'UPDATE profiles SET full_name = ?, avatar_url = ?, birthday = ? WHERE id = ?',
                [full_name || userProfile.full_name, avatar_url || userProfile.avatar_url, birthday || userProfile.birthday, userProfile.id]
            );

            // Also ensure their streak starts from w1 if it was 0/null
            if (!userProfile.streak_count || userProfile.streak_count === 0) {
                await pool.execute(
                    'UPDATE profiles SET streak_count = 1, streak_updated_at = NOW() WHERE id = ?',
                    [userProfile.id]
                );
            }

            const [updatedRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userProfile.id]);
            return res.status(200).json(formatProfile(updatedRows[0]));
        }

        // Create new user profile for Google login
        const id = googleId || `usr_g_${Math.random().toString(36).substring(2, 11)}`;
        const username = email.split('@')[0] || `user_${id}`;
        
        await pool.execute(
            'INSERT INTO profiles (id, full_name, username, email, avatar_url, role, v_coins, city, phone, streak_count, streak_updated_at, birthday) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)',
            [id, full_name || 'Google User', username, email, avatar_url || '', 'user', 500, 'Mumbai', '', birthday || null]
        );

        logActivity({ type: 'profile_created', userId: id });

        // Process referral if code is provided for new user
        if (referred_by_code) {
            await processReferralReward(id, referred_by_code);
        }

        const [userRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);
        res.status(201).json(formatProfile(userRows[0]));
    } catch (error) {
        console.error('Google login sync error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Request Password Reset Code
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const [rows] = await pool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        const user = rows[0];
        // Generate a secure 6-digit numeric OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save token and expire time (15 mins from now)
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await pool.execute(
            'UPDATE profiles SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [otp, expiry, user.id]
        );

        // Send Email
        try {
            await sendResetEmail(email, otp);
            console.log(`[Forgot Password] OTP verification code ${otp} sent to ${email}`);
        } catch (emailErr) {
            console.error('[Forgot Password] Email send error:', emailErr);
            // Even if email fails, log code to terminal so it's testable!
            console.log(`[DEVELOPMENT ONLY] OTP verification code: ${otp}`);
        }

        res.status(200).json({ message: 'Verification code sent to your email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reset Password with Code
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Email, OTP, and new password are required' });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM profiles WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
            [email, otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification code (OTP)' });
        }

        const user = rows[0];

        // Update password, clear token
        await pool.execute(
            'UPDATE profiles SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [newPassword, user.id]
        );

        logActivity({ type: 'password_reset', userId: user.id });
        console.log(`[Reset Password] Password reset successfully for ${email}`);

        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send OTP via SMS (Message Central)
app.post('/api/auth/otp/send', async (req, res) => {
    const { phone } = req.body;
    try {
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Keep last 10 digits
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) {
            return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
        }
        const mobileNo = digits.slice(-10);

        // Generate a 6-digit random OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Upsert into DB with 10 minutes validity
        await pool.execute(
            'INSERT INTO phone_otps (phone, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at)',
            [mobileNo, otpCode]
        );

        const message = `[VHOP] Your OTP for secure login is ${otpCode}. Valid for 10 minutes. Please do not share this code. 🎶`;

        // Sandbox check
        const isSandbox = !process.env.MSG_CENTRAL_AUTH_TOKEN || 
                          process.env.MSG_CENTRAL_AUTH_TOKEN.includes('placeholder') || 
                          process.env.MSG_CENTRAL_AUTH_TOKEN.includes('your_message');

        if (isSandbox) {
            console.log(`\n===============================================\n[OTP SANDBOX DEBUG]\nPhone: +91${mobileNo}\nOTP Code: ${otpCode}\nMessage: ${message}\n===============================================\n`);
            return res.status(200).json({ 
                success: true, 
                message: 'OTP sent successfully (Sandbox Mode)', 
                devOtp: otpCode 
            });
        }

        const smsResult = await sendSMS(mobileNo, message);
        if (smsResult.success) {
            res.status(200).json({ success: true, message: 'OTP sent successfully' });
        } else {
            console.error('Failed to send OTP SMS:', smsResult.error);
            // Fallback to debug in case of API failure during testing/demo
            res.status(500).json({ error: 'Failed to send OTP SMS. Please try again later.' });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify OTP & Login/Register (Message Central)
app.post('/api/auth/otp/verify', async (req, res) => {
    const { phone, code, referred_by_code } = req.body;
    try {
        if (!phone || !code) {
            return res.status(400).json({ error: 'Phone number and OTP code are required' });
        }

        const digits = phone.replace(/\D/g, '');
        const mobileNo = digits.slice(-10);

        // Fetch OTP from database
        const [otpRows] = await pool.execute(
            'SELECT * FROM phone_otps WHERE phone = ? AND expires_at > NOW()',
            [mobileNo]
        );

        if (otpRows.length === 0 || otpRows[0].otp_code !== code.toString().trim()) {
            return res.status(400).json({ error: 'Invalid or expired OTP code' });
        }

        // Clean up OTP to prevent reuse
        await pool.execute('DELETE FROM phone_otps WHERE phone = ?', [mobileNo]);

        // Find existing user profile
        const [userRows] = await pool.execute(
            'SELECT * FROM profiles WHERE phone = ? OR phone = ?',
            [mobileNo, `+91${mobileNo}`]
        );

        if (userRows.length > 0) {
            // Existing user - Log them in
            const userProfile = userRows[0];

            // If phone doesn't match E.164 exactly, update it to clean 10 digits
            if (userProfile.phone !== mobileNo) {
                await pool.execute('UPDATE profiles SET phone = ? WHERE id = ?', [mobileNo, userProfile.id]);
            }

            // Streak check/update
            if (!userProfile.streak_count || userProfile.streak_count === 0) {
                await pool.execute(
                    'UPDATE profiles SET streak_count = 1, streak_updated_at = NOW() WHERE id = ?',
                    [userProfile.id]
                );
            }

            // Process referral
            if (referred_by_code && !userProfile.referral_rewarded) {
                await processReferralReward(userProfile.id, referred_by_code);
            }

            const [updatedRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userProfile.id]);
            console.log(`[OTP AUTH] User logged in: ${updatedRows[0].phone}`);
            return res.status(200).json(formatProfile(updatedRows[0]));
        }

        // New User - Auto-Register
        const id = `usr_p_${Math.random().toString(36).substring(2, 11)}`;
        const username = `user_${mobileNo}`;
        const full_name = `User ${mobileNo.slice(-4)}`;
        const email = `${mobileNo}@vhop.in`; // Default placeholder
        const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobileNo}`;

        await pool.execute(
            'INSERT INTO profiles (id, full_name, username, email, avatar_url, role, v_coins, city, phone, streak_count, streak_updated_at, onboarded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), FALSE)',
            [id, full_name, username, email, avatar_url, 'user', 500, 'Visakhapatnam', mobileNo]
        );

        logActivity({ type: 'profile_created', userId: id });

        // Process referral reward for new user
        if (referred_by_code) {
            await processReferralReward(id, referred_by_code);
        }

        const [newUserRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);
        console.log(`[OTP AUTH] New user created: +91${mobileNo}`);
        res.status(201).json(formatProfile(newUserRows[0]));

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Update Onboarding Status
app.post('/api/auth/onboard', async (req, res) => {
    const { userId, interests } = req.body;
    try {
        await pool.execute(
            'UPDATE profiles SET onboarded = true, interests = ? WHERE id = ?',
            [JSON.stringify(interests), userId]
        );
        res.status(200).json({ message: 'Onboarding completed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Complete Profile and claim 100 V-Coins reward
app.put('/api/auth/profile/complete', async (req, res) => {
    const { userId, age, phone, address, gender, birthday } = req.body;
    try {
        const [rows] = await pool.execute('SELECT v_coins, v_coins_rewarded FROM profiles WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const user = rows[0];
        let v_coins = user.v_coins;
        let rewardCredited = false;
        let new_v_coins_rewarded = user.v_coins_rewarded;

        if (!user.v_coins_rewarded) {
            v_coins += 100;
            new_v_coins_rewarded = true;
            rewardCredited = true;
        }

        await pool.execute(
            'UPDATE profiles SET age = ?, phone = ?, address = ?, gender = ?, birthday = ?, v_coins = ?, v_coins_rewarded = ? WHERE id = ?',
            [age ? parseInt(age, 10) : null, phone || '', address || '', gender || null, birthday || null, v_coins, new_v_coins_rewarded, userId]
        );

        logActivity({ type: 'profile_completed', userId, coinsCredited: rewardCredited ? 100 : 0 });

        const [updatedRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
        res.status(200).json({ 
            user: formatProfile(updatedRows[0]),
            rewardCredited,
            message: rewardCredited ? 'Profile completed & 100 V-Coins rewarded!' : 'Profile updated successfully.'
        });
    } catch (error) {
        console.error('Error completing profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Profile details
app.put('/api/auth/profile/update', async (req, res) => {
    const { userId, fullName, username, city, phone, age, gender, address, avatarUrl, birthday } = req.body;
    try {
        // Verify unique username if changed
        if (username) {
            const [existing] = await pool.execute('SELECT id FROM profiles WHERE username = ? AND id != ?', [username, userId]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username is already taken.' });
            }
        }

        let query = 'UPDATE profiles SET full_name = ?, username = ?, city = ?, phone = ?, age = ?, gender = ?, address = ?, birthday = ?';
        let params = [
            fullName || null,
            username || null,
            city || 'Mumbai',
            phone || '',
            age ? parseInt(age, 10) : null,
            gender || null,
            address || '',
            birthday || null
        ];

        if (avatarUrl !== undefined) {
            query += ', avatar_url = ?';
            params.push(avatarUrl);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await pool.execute(query, params);

        // Check if profile is now complete and reward if not already rewarded
        const [profileRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
        if (profileRows.length > 0) {
            const updatedUser = profileRows[0];
            const isNowComplete = updatedUser.phone && updatedUser.birthday && updatedUser.gender && updatedUser.age;
            if (isNowComplete && !updatedUser.v_coins_rewarded) {
                await pool.execute(
                    'UPDATE profiles SET v_coins = v_coins + 100, v_coins_rewarded = true WHERE id = ?',
                    [userId]
                );
                console.log(`[Profile Update] User ${userId} completed profile in settings. Rewarded 100 V-Coins.`);
                logActivity({ type: 'profile_completed', userId, coinsCredited: 100 });
            }
        }

        const [finalRows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
        res.status(200).json({ 
            user: formatProfile(finalRows[0]),
            message: 'Profile updated successfully.'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Aadhaar & unlock Silver VIP status
app.post('/api/profile/verify-aadhaar', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        await pool.execute(
            'UPDATE profiles SET aadhaar_verified = true, vip_tier = "Silver", v_coins = v_coins + 100 WHERE id = ?',
            [userId]
        );

        const [rows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
        const updatedUser = formatProfile(rows[0]);

        res.json({
            message: 'Aadhaar successfully verified! Silver VIP status unlocked (+100 V-Coins)!',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simulate weekly activity/action (booking or referral) to test streaks
app.post('/api/profile/simulate-action', async (req, res) => {
    const { userId, advanceWeek, actionType } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // If advanceWeek is true, mock that the last streak update happened 8 days ago
            if (advanceWeek) {
                await connection.execute(
                    'UPDATE profiles SET streak_updated_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE id = ?',
                    [userId]
                );
            }

            // Perform actions based on type
            if (actionType === 'booking') {
                // Increment nights_out
                await connection.execute(
                    'UPDATE profiles SET nights_out = nights_out + 1 WHERE id = ?',
                    [userId]
                );
            } else if (actionType === 'referral') {
                // Increment referred_count
                await connection.execute(
                    'UPDATE profiles SET referred_count = referred_count + 1 WHERE id = ?',
                    [userId]
                );
            }

            // Maintain the weekly streak
            await maintainWeeklyStreak(connection, userId);

            await connection.commit();

            // Fetch the updated profile to send back
            const [rows] = await connection.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
            const updatedUser = formatProfile(rows[0]);

            res.json({
                message: `Simulation of ${actionType} completed successfully!`,
                user: updatedUser
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get checked-in visitors for a specific admin venue
app.get('/api/admin/visitors/:adminId', async (req, res) => {
    try {
        const resolvedAdminId = await resolveAdminUserId(req.params.adminId);
        const [rows] = await pool.execute(
            'SELECT * FROM visitors WHERE admin_id = ? ORDER BY scanned_at DESC',
            [resolvedAdminId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get registered users list for scanner quick simulation
app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, full_name, username, email, avatar_url, role, v_coins, city, phone, age, address FROM profiles WHERE role = 'user' ORDER BY created_at DESC"
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching registered users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check-in / Scan visitor
app.post('/api/admin/visitors', async (req, res) => {
    const { adminId, visitorName, age, phone, email, address } = req.body;
    const id = `vis_${Math.random().toString(36).substring(2, 11)}`;
    try {
        const resolvedAdminId = await resolveAdminUserId(adminId);
        await pool.execute(
            'INSERT INTO visitors (id, admin_id, visitor_name, age, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, resolvedAdminId, visitorName, age ? parseInt(age, 10) : null, phone || '', email || '', address || '']
        );

        logActivity({ type: 'visitor_scanned', adminId: resolvedAdminId, visitorName, email });
        res.status(201).json({ id, message: 'Visitor checked in successfully.' });
    } catch (error) {
        console.error('Error checking in visitor:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- EVENTS ---

// Get all events
app.get('/api/events', async (req, res) => {
    const { city } = req.query;
    try {
        let sql = 'SELECT * FROM events WHERE status = "published" AND COALESCE(end_date, start_date) >= NOW()';
        let params = [];

        if (city && city !== 'All') {
            sql += ' AND city = ?';
            params.push(city);
        }

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create event (Admin)
app.post('/api/events', async (req, res) => {
    const event = req.body;
    const id = `ev_${Math.random().toString(36).substring(2, 11)}`;
    try {
        await pool.execute(
            'INSERT INTO events (id, company_id, title, short_description, description, venue_name, city, category, price, cover_image, start_date, ticket_types, status, google_maps_url, artists) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, event.company_id, event.title, event.short_description, event.description, event.venue_name, event.city, event.category, event.price, event.cover_image, event.start_date, JSON.stringify(event.ticket_types), event.status || 'draft', event.google_maps_url || null, event.artists ? JSON.stringify(event.artists) : null]
        );
        res.status(201).json({ id, message: 'Event created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update event (Admin & Super Admin)
app.put('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    const event = req.body;
    try {
        await pool.execute(
            'UPDATE events SET title = ?, short_description = ?, description = ?, venue_name = ?, city = ?, category = ?, price = ?, cover_image = ?, start_date = ?, ticket_types = ?, status = ?, google_maps_url = ?, artists = ? WHERE id = ?',
            [
                event.title,
                event.short_description || null,
                event.description || null,
                event.venue_name || null,
                event.city,
                event.category || null,
                event.price || 0,
                event.cover_image || null,
                event.start_date,
                JSON.stringify(event.ticket_types || []),
                event.status || 'draft',
                event.google_maps_url || null,
                event.artists ? JSON.stringify(event.artists) : null,
                id
            ]
        );
        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
    try {
        // First delete bookings associated with the event to satisfy foreign key constraint
        await pool.execute('DELETE FROM bookings WHERE event_id = ?', [req.params.id]);
        // Then delete the event itself
        await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- BOOKINGS ---

// Create booking
app.post('/api/bookings', async (req, res) => {
    const booking = req.body;
    const id = `bk_${Math.random().toString(36).substring(2, 11)}`;
    try {
        // Fetch user info for Cashfree customer_details
        const [userRows] = await pool.execute('SELECT email, full_name, phone FROM profiles WHERE id = ?', [booking.user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        
        const userEmail = userRows[0].email || 'guest@vhop.in';
        const userName = userRows[0].full_name || 'Guest User';
        let userPhone = userRows[0].phone || '9999999999';
        
        // Clean phone number: Cashfree requires valid phone
        userPhone = userPhone.replace(/\D/g, '');
        if (userPhone.length < 10) {
            userPhone = '9999999999';
        }

        // Start Transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insert Booking with pending status
            await connection.execute(
                'INSERT INTO bookings (id, event_id, user_id, quantity, total_amount, ticket_name, price, payment_id, payment_status, booking_status, booking_id, qr_code, guests, coupon_code, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    id, 
                    booking.event_id, 
                    booking.user_id, 
                    booking.quantity, 
                    booking.total_amount, 
                    booking.ticket_name, 
                    booking.price, 
                    '', // No payment_id yet
                    'pending', 
                    'pending', 
                    booking.booking_id, 
                    booking.qr_code, 
                    JSON.stringify(booking.guests || []),
                    booking.coupon_code || null,
                    booking.discount_amount || 0.00
                ]
            );

            // 2. Call Cashfree to Create Order
            if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
                throw new Error('Cashfree is not configured on this server. Please set CASHFREE_APP_ID in environment variables.');
            }

            const cfOrderOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY,
                    'x-api-version': '2023-08-01'
                }
            };

            const cfOrderBody = {
                order_id: booking.booking_id,
                order_amount: Number(booking.total_amount),
                order_currency: 'INR',
                customer_details: {
                    customer_id: booking.user_id,
                    customer_phone: userPhone,
                    customer_email: userEmail,
                    customer_name: userName
                },
                order_meta: {
                    return_url: `${(req.headers.origin && req.headers.origin.startsWith('https://')) ? req.headers.origin : 'https://vhop.in'}/profile?payment_status=completed&order_id={order_id}`
                }
            };

            const cfResponse = await makeHttpsRequest(`${CASHFREE_BASE_URL}/orders`, cfOrderOptions, cfOrderBody);
            
            if (!cfResponse.ok) {
                const cfErr = await cfResponse.text();
                console.error('Cashfree order creation error:', cfErr);
                throw new Error(`Failed to create payment session with Cashfree: ${cfErr}`);
            }

            const cfOrderData = await cfResponse.json();
            
            await connection.commit();
            
            res.status(201).json({ 
                id, 
                booking_id: booking.booking_id, 
                payment_session_id: cfOrderData.payment_session_id,
                payment_env: CASHFREE_ENV,
                status: 'pending'
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in POST /api/bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user bookings
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT b.*, e.title as event_title, e.cover_image, e.venue_name, e.city, e.start_date, e.google_maps_url FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.user_id = ? AND b.booking_status IN (\'confirmed\', \'checked_in\')',
            [req.params.userId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lookup booking by code (admin scan validation)
app.get('/api/admin/bookings/lookup/:code', async (req, res) => {
    const { code } = req.params;
    const { adminId } = req.query;
    
    if (!code || !adminId) {
        return res.status(400).json({ error: 'Missing booking code or adminId parameter' });
    }
    
    try {
        const resolvedAdminId = await resolveAdminUserId(adminId);
        
        // Fetch the scanning admin's role and company
        const [adminRows] = await pool.execute('SELECT role FROM profiles WHERE id = ?', [adminId]);
        const isAdminSuper = adminRows.length > 0 && adminRows[0].role === 'superadmin';
        
        const [companyRows] = await pool.execute('SELECT id FROM companies WHERE admin_user_id = ?', [resolvedAdminId]);
        const companyId = companyRows.length > 0 ? companyRows[0].id : null;
        
        // Fetch the booking details
        const [bookingRows] = await pool.execute(
            `SELECT b.*, e.title as event_title, e.cover_image, e.venue_name, e.city, e.start_date, e.company_id,
                    p.full_name as buyer_name, p.email as buyer_email, p.phone as buyer_phone
             FROM bookings b
             JOIN events e ON b.event_id = e.id
             LEFT JOIN profiles p ON b.user_id = p.id
             WHERE (b.booking_id = ? OR b.id = ?) AND b.booking_status IN ('confirmed', 'checked_in')`,
            [code, code]
        );
        
        if (bookingRows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookingRows[0];
        
        // Determine validity: must be superadmin OR belong to this admin's company
        const isValid = isAdminSuper || (companyId !== null && booking.company_id === companyId);
        const isAlreadyCheckedIn = booking.booking_status === 'checked_in';
        
        // Parse guests JSON safely
        let guests = [];
        if (booking.guests) {
            try {
                guests = typeof booking.guests === 'string' ? JSON.parse(booking.guests) : booking.guests;
            } catch (e) {
                console.error('Error parsing booking guests:', e);
            }
        }
        
        res.json({
            booking: {
                id: booking.id,
                booking_id: booking.booking_id,
                event_id: booking.event_id,
                event_title: booking.event_title,
                cover_image: booking.cover_image,
                venue_name: booking.venue_name,
                city: booking.city,
                start_date: booking.start_date,
                quantity: booking.quantity,
                ticket_name: booking.ticket_name,
                price: booking.price,
                booking_status: booking.booking_status,
                buyer_name: booking.buyer_name,
                buyer_email: booking.buyer_email,
                buyer_phone: booking.buyer_phone,
                guests: guests
            },
            isValid,
            isAlreadyCheckedIn
        });
    } catch (error) {
        console.error('Error looking up booking:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin booking check-in & individual guests logging
app.post('/api/admin/bookings/checkin', async (req, res) => {
    const { bookingId, adminId } = req.body;
    if (!bookingId || !adminId) {
        return res.status(400).json({ error: 'Missing bookingId or adminId parameter' });
    }
    
    try {
        const resolvedAdminId = await resolveAdminUserId(adminId);
        
        // Fetch current booking details first to check status and read guests
        const [bookingRows] = await pool.execute(
            `SELECT b.*, p.full_name as buyer_name, p.email as buyer_email, p.phone as buyer_phone
             FROM bookings b
             LEFT JOIN profiles p ON b.user_id = p.id
             WHERE (b.booking_id = ? OR b.id = ?) AND b.booking_status = 'confirmed'`,
            [bookingId, bookingId]
        );
        
        if (bookingRows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookingRows[0];
        if (booking.booking_status === 'checked_in') {
            return res.status(400).json({ error: 'Ticket is already checked in.' });
        }
        
        // Parse guests list
        let guests = [];
        if (booking.guests) {
            try {
                guests = typeof booking.guests === 'string' ? JSON.parse(booking.guests) : booking.guests;
            } catch (e) {
                console.error('Error parsing booking guests:', e);
            }
        }
        
        // Use default guest list of quantity 1 with buyer's name if guests is empty
        if (!guests || guests.length === 0) {
            guests = [{ name: booking.buyer_name || 'Ticket Buyer', age: null }];
        }
        
        // Start database transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // 1. Update Booking Status
            await connection.execute(
                'UPDATE bookings SET booking_status = \'checked_in\' WHERE id = ?',
                [booking.id]
            );
            
            // 2. Insert all individual guests into the visitors log
            for (const guest of guests) {
                const visitorId = `vis_${Math.random().toString(36).substring(2, 11)}`;
                const guestAge = guest.age ? parseInt(guest.age, 10) : null;
                const guestName = guest.name || booking.buyer_name || 'Ticket Guest';
                const guestAddress = `Checked in via Booking ${booking.booking_id || booking.id}`;
                
                await connection.execute(
                    'INSERT INTO visitors (id, admin_id, visitor_name, age, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        visitorId,
                        resolvedAdminId,
                        guestName,
                        isNaN(guestAge) ? null : guestAge,
                        booking.buyer_phone || '',
                        booking.buyer_email || '',
                        guestAddress
                    ]
                );
            }
            
            await connection.commit();
            
            logActivity({
                type: 'booking_checked_in',
                adminId: resolvedAdminId,
                bookingId: booking.booking_id || booking.id,
                guestsCount: guests.length
            });
            
            res.status(200).json({
                message: 'Check-in completed successfully',
                guestsCheckedInCount: guests.length
            });
        } catch (transactionErr) {
            await connection.rollback();
            throw transactionErr;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error checking in booking:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ADMIN / GLOBAL ---

// Get global admin statistics
app.get('/api/admin/global-stats', async (req, res) => {
    try {
        // 1. Fetch all events
        const [events] = await pool.execute('SELECT * FROM events ORDER BY created_at DESC');

        // 2. Fetch platform-wide stats
        const [statsRows] = await pool.execute(`
            SELECT 
                SUM(total_amount) as totalRevenue,
                SUM(quantity) as totalBookings,
                (SELECT COUNT(*) FROM events WHERE status = 'published') as activeEvents
            FROM bookings
        `);

        const stats = {
            totalRevenue: statsRows[0].totalRevenue || 0,
            totalBookings: statsRows[0].totalBookings || 0,
            activeEvents: statsRows[0].activeEvents || 0
        };

        res.json({ events, stats });
    } catch (error) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get partner-specific statistics and events
app.get('/api/admin/stats/:userId', async (req, res) => {
    try {
        const resolvedUserId = await resolveAdminUserId(req.params.userId);
        // 1. Get company belonging to this partner
        const [companies] = await pool.execute('SELECT * FROM companies WHERE admin_user_id = ?', [resolvedUserId]);
        if (companies.length === 0) {
            return res.json({ 
                company: null, 
                events: [], 
                stats: { totalRevenue: 0, totalBookings: 0, activeEvents: 0 } 
            });
        }

        const company = companies[0];

        // 2. Fetch events belonging to this company with ticket sales populated
        const [events] = await pool.execute(
            'SELECT e.*, (SELECT COALESCE(SUM(quantity), 0) FROM bookings WHERE event_id = e.id AND booking_status IN (\'confirmed\', \'checked_in\')) as tickets_sold FROM events e WHERE e.company_id = ? ORDER BY e.created_at DESC',
            [company.id]
        );

        // 3. Fetch statistics for their bookings
        const [statsRows] = await pool.execute(`
            SELECT 
                COALESCE(SUM(b.total_amount), 0) as totalRevenue,
                COALESCE(SUM(b.quantity), 0) as totalBookings
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE e.company_id = ? AND b.booking_status IN ('confirmed', 'checked_in')
        `, [company.id]);

        const [activeEventsRows] = await pool.execute(
            'SELECT COUNT(*) as activeCount FROM events WHERE company_id = ? AND status = \'published\'',
            [company.id]
        );

        // 4. Fetch group bookings count (quantity >= 3)
        const [groupBookingsRows] = await pool.execute(`
            SELECT COALESCE(SUM(b.quantity), 0) as groupCount 
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE e.company_id = ? AND b.quantity >= 3 AND b.booking_status IN ('confirmed', 'checked_in')
        `, [company.id]);

        const totalBookings = Number(statsRows[0].totalBookings) || 0;

        const stats = {
            totalRevenue: Number(statsRows[0].totalRevenue) || 0,
            totalBookings: totalBookings,
            activeEvents: Number(activeEventsRows[0].activeCount) || 0,
            totalHosted: events.length,
            totalGroupBookings: Number(groupBookingsRows[0].groupCount) || 0,
            totalClicked: totalBookings * 4 + 48,
            totalOpened: totalBookings * 2 + 24
        };

        res.json({ company, events, stats });
    } catch (error) {
        console.error('Error fetching partner stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get bookings (guest list) for a specific event
app.get('/api/admin/bookings/event/:eventId', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT b.*, p.full_name as user_name, p.email as user_email 
            FROM bookings b 
            LEFT JOIN profiles p ON b.user_id = p.id 
            WHERE b.event_id = ? AND b.booking_status IN ('confirmed', 'checked_in')
            ORDER BY b.booked_at DESC
        `, [req.params.eventId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching event bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get platform-wide statistics and data for Superadmin
app.get('/api/superadmin/stats', async (req, res) => {
    try {
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM profiles WHERE role = \'user\'');
        const [companyCount] = await pool.execute('SELECT COUNT(*) as count FROM companies WHERE verified = 1');
        const [eventCount] = await pool.execute('SELECT COUNT(*) as count FROM events');
        const [revenueRows] = await pool.execute('SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM bookings WHERE booking_status IN (\'confirmed\', \'checked_in\')');
        
        // Fetch all events with company details and ticket sales
        const [events] = await pool.execute(`
            SELECT e.*, c.name as company_name, 
                   COALESCE((SELECT SUM(quantity) FROM bookings WHERE event_id = e.id AND booking_status IN ('confirmed', 'checked_in')), 0) as tickets_sold
            FROM events e
            LEFT JOIN companies c ON e.company_id = c.id
            ORDER BY e.created_at DESC
        `);

        // Fetch all partners
        const [partners] = await pool.execute(`
            SELECT p.*, c.name as company_name, c.city as company_city, c.verified as company_verified
            FROM profiles p
            LEFT JOIN companies c ON c.admin_user_id = p.id
            WHERE p.role = 'admin'
            ORDER BY p.created_at DESC
        `);

        res.json({
            stats: {
                totalUsers: userCount[0].count,
                activeCompanies: companyCount[0].count,
                totalEvents: eventCount[0].count,
                grossRevenue: Number(revenueRows[0].totalRevenue) || 0
            },
            events,
            partners
        });
    } catch (error) {
        console.error('Error fetching superadmin stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve event by Superadmin
app.post('/api/superadmin/events/approve', async (req, res) => {
    const { eventId } = req.body;
    try {
        await pool.execute('UPDATE events SET status = \'published\' WHERE id = ?', [eventId]);
        
        // Log activity
        logActivity({ type: 'event_approved', eventId });
        
        res.json({ message: 'Event approved successfully' });
    } catch (error) {
        console.error('Error approving event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new partner (admin) by Superadmin
app.post('/api/superadmin/partners', async (req, res) => {
    const { email, password, full_name, company_name, city } = req.body;
    try {
        const [existing] = await pool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const partnerId = `usr_partner_${Math.random().toString(36).substring(2, 11)}`;
        const username = email.split('@')[0] || `partner_${partnerId}`;
        const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

        // 1. Insert into profiles
        await pool.execute(
            'INSERT INTO profiles (id, full_name, username, email, password, avatar_url, role, v_coins, city, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [partnerId, full_name, username, email, password, avatar_url, 'admin', 0, city || 'Mumbai', '']
        );

        // 2. Insert into companies
        const companyId = `comp_partner_${Math.random().toString(36).substring(2, 11)}`;
        await pool.execute(
            'INSERT INTO companies (id, name, admin_user_id, city, description, website, contact_email, phone, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [companyId, company_name, partnerId, city || 'Mumbai', 'Venue partner company.', '', email, '', 1]
        );

        // Log activity
        logActivity({ type: 'partner_created', partnerId, companyName: company_name });

        res.status(201).json({ message: 'Partner registered successfully' });
    } catch (error) {
        console.error('Error adding partner:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get admin dashboard data
app.get('/api/admin/dashboard/:userId', async (req, res) => {
    try {
        const resolvedUserId = await resolveAdminUserId(req.params.userId);
        // 1. Get company
        // Fetch company and events in parallel for better performance
        const [companies] = await pool.execute('SELECT * FROM companies WHERE admin_user_id = ?', [resolvedUserId]);

        if (companies.length === 0) return res.status(404).json({ error: 'Company not found' });

        const company = companies[0];
        const [events] = await pool.execute('SELECT * FROM events WHERE company_id = ?', [company.id]);

        // Add cache control for faster repeat visits
        res.set('Cache-Control', 'private, max-age=60');
        res.json({ company, events });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update company
app.put('/api/companies/:id', async (req, res) => {
    const { name, phone, website, description, payout_upi, contact_email } = req.body;
    try {
        await pool.execute(
            'UPDATE companies SET name = ?, phone = ?, website = ?, description = ?, payout_upi = ?, contact_email = ? WHERE id = ?',
            [name, phone, website, description, payout_upi, contact_email, req.params.id]
        );
        res.json({ message: 'Company updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify company
app.post('/api/companies/:id/verify', async (req, res) => {
    try {
        await pool.execute('UPDATE companies SET verified = true WHERE id = ?', [req.params.id]);
        res.json({ message: 'Company verified' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- TEAMS MANAGEMENT ---

// Get all subadmins belonging to an admin
app.get('/api/admin/teams/:adminId', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, full_name, email, role, parent_admin_id, created_at FROM profiles WHERE parent_admin_id = ? AND role = 'subadmin' ORDER BY created_at DESC",
            [req.params.adminId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new subadmin
app.post('/api/admin/teams', async (req, res) => {
    const { name, email, password, parentAdminId } = req.body;
    if (!name || !email || !password || !parentAdminId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = `sub_${Math.random().toString(36).substring(2, 11)}`;
    const username = email.split('@')[0] + Math.floor(Math.random() * 100);
    const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
    try {
        // Check if email already exists
        const [existing] = await pool.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        await pool.execute(
            "INSERT INTO profiles (id, full_name, username, email, password, avatar_url, role, parent_admin_id, onboarded) VALUES (?, ?, ?, ?, ?, ?, 'subadmin', ?, true)",
            [id, name, username, email, password, avatar_url, parentAdminId]
        );

        res.status(201).json({ id, name, email, role: 'subadmin', parent_admin_id: parentAdminId, message: 'Team member added successfully' });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a subadmin
app.delete('/api/admin/teams/:subadminId', async (req, res) => {
    try {
        await pool.execute("DELETE FROM profiles WHERE id = ? AND role = 'subadmin'", [req.params.subadminId]);
        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        console.error('Error deleting team member:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ADMIN SUPPORT CHAT ---

// Get support chat messages for an admin channel
app.get('/api/support/messages/:adminId', async (req, res) => {
    try {
        const resolvedAdminId = await resolveAdminUserId(req.params.adminId);
        const [rows] = await pool.execute(
            `SELECT sm.*, p.full_name as sender_name, p.role as sender_role, p.avatar_url as sender_avatar 
             FROM support_messages sm 
             LEFT JOIN profiles p ON sm.sender_id = p.id 
             WHERE sm.admin_id = ? 
             ORDER BY sm.created_at ASC`,
            [resolvedAdminId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching support messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Post a new support message
app.post('/api/support/messages', async (req, res) => {
    const { adminId, senderId, message } = req.body;
    if (!adminId || !senderId || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = `msg_${Math.random().toString(36).substring(2, 11)}`;
    try {
        const resolvedAdminId = await resolveAdminUserId(adminId);
        await pool.execute(
            'INSERT INTO support_messages (id, admin_id, sender_id, message) VALUES (?, ?, ?, ?)',
            [id, resolvedAdminId, senderId, message]
        );
        
        // Fetch the newly added message with sender info to return it nicely
        const [rows] = await pool.execute(
            `SELECT sm.*, p.full_name as sender_name, p.role as sender_role, p.avatar_url as sender_avatar 
             FROM support_messages sm 
             LEFT JOIN profiles p ON sm.sender_id = p.id 
             WHERE sm.id = ?`,
            [id]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error sending support message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all active support chat channels for Super Admin dashboard
app.get('/api/superadmin/support/chats', async (req, res) => {
    try {
        // Fetch distinct admin_ids that have messages, joining profiles and companies to get metadata
        const [rows] = await pool.execute(
            `SELECT DISTINCT 
                 sm.admin_id,
                 p.full_name as admin_name,
                 p.email as admin_email,
                 c.name as company_name,
                 (SELECT message FROM support_messages WHERE admin_id = sm.admin_id ORDER BY created_at DESC LIMIT 1) as last_message,
                 (SELECT created_at FROM support_messages WHERE admin_id = sm.admin_id ORDER BY created_at DESC LIMIT 1) as last_message_time
             FROM support_messages sm
             JOIN profiles p ON sm.admin_id = p.id
             LEFT JOIN companies c ON c.admin_user_id = p.id
             ORDER BY last_message_time DESC`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching support chats for superadmin:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- CASHFREE INTEGRATION ---
const https = require('https');

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox'; // sandbox or production
const CASHFREE_BASE_URL = CASHFREE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
    console.log(`🟢 Cashfree integration initialized (${CASHFREE_ENV} environment).`);
} else {
    console.warn('⚠️ Cashfree configuration is missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY.');
}

// HTTPS helper to communicate with Cashfree PG APIs without external libraries
function makeHttpsRequest(url, options, body = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    statusCode: res.statusCode,
                    headers: res.headers,
                    json: () => Promise.resolve(JSON.parse(data)),
                    text: () => Promise.resolve(data)
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        
        req.end();
    });
}

// Helper function to confirm a booking after payment is verified (used by verify & webhooks)
async function confirmBooking(bookingId, paymentId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Fetch the pending booking using the user-facing booking ID (e.g., VH-XXXXXX)
        const [bookings] = await connection.execute(
            'SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE',
            [bookingId]
        );
        
        if (bookings.length === 0) {
            await connection.rollback();
            return { success: false, error: 'Booking not found' };
        }
        
        const booking = bookings[0];
        
        // If already paid, return success (idempotent helper)
        if (booking.payment_status === 'paid' || booking.booking_status === 'confirmed') {
            await connection.rollback();
            return { success: true, alreadyConfirmed: true, booking };
        }
        
        // Update booking to confirmed / paid
        await connection.execute(
            'UPDATE bookings SET payment_status = ?, booking_status = ?, payment_id = ? WHERE booking_id = ?',
            ['paid', 'confirmed', paymentId || 'pay_cashfree', bookingId]
        );
        
        // Update event tickets sold count
        await connection.execute(
            'UPDATE events SET tickets_sold = tickets_sold + ? WHERE id = ?',
            [booking.quantity, booking.event_id]
        );
        
        // Update user profile nights_out count
        await connection.execute(
            'UPDATE profiles SET nights_out = nights_out + 1 WHERE id = ?',
            [booking.user_id]
        );
        
        await maintainWeeklyStreak(connection, booking.user_id);
        
        await connection.commit();
        
        // Send email + SMS in the background (non-blocking)
        (async () => {
            try {
                const [userRows] = await pool.execute('SELECT email, full_name, phone FROM profiles WHERE id = ?', [booking.user_id]);
                const [eventRows] = await pool.execute('SELECT * FROM events WHERE id = ?', [booking.event_id]);
                
                if (userRows.length > 0 && eventRows.length > 0) {
                    const userInfo  = userRows[0];
                    const eventInfo = eventRows[0];

                    // 1. Send booking confirmation email
                    await sendBookingEmail(
                        { 
                            event_id: booking.event_id,
                            event_title: eventInfo.title,
                            venue_name: eventInfo.venue_name,
                            city: eventInfo.city,
                            start_date: eventInfo.start_date,
                            cover_image: eventInfo.cover_image,
                            user_id: booking.user_id,
                            quantity: booking.quantity,
                            total_amount: booking.total_amount,
                            ticket_name: booking.ticket_name,
                            price: booking.price,
                            payment_id: paymentId || 'pay_cashfree',
                            payment_status: 'paid',
                            booking_status: 'confirmed',
                            booking_id: booking.booking_id,
                            qr_code: booking.qr_code,
                            booked_at: booking.booked_at,
                            guests: typeof booking.guests === 'string' ? JSON.parse(booking.guests) : (booking.guests || []),
                            id: booking.id, 
                            user_name: userInfo.full_name 
                        },
                        eventInfo,
                        userInfo.email
                    );

                    // 2. Send booking confirmation SMS (non-blocking, best-effort)
                    if (userInfo.phone) {
                        const smsBody = buildBookingConfirmationSMS({
                            userName:    userInfo.full_name,
                            eventTitle:  eventInfo.title,
                            bookingId:   booking.booking_id,
                            venueName:   eventInfo.venue_name,
                            city:        eventInfo.city,
                            startDate:   eventInfo.start_date,
                            quantity:    booking.quantity,
                            totalAmount: booking.total_amount
                        });
                        sendSMS(userInfo.phone, smsBody).catch(err =>
                            console.error('[SMS] Booking confirmation SMS failed:', err)
                        );
                    }
                }
            } catch (emailErr) {
                console.error('Background Email/SMS Error in confirmBooking:', emailErr);
            }
        })();
        
        return { success: true, alreadyConfirmed: false, booking };
    } catch (err) {
        await connection.rollback();
        console.error('Error in confirmBooking:', err);
        return { success: false, error: err.message };
    } finally {
        connection.release();
    }
}

// Create Order (kept for backwards-compatibility or direct integration if needed)
app.post('/api/payments/order', async (req, res) => {
    const { amount, currency, customer_id, customer_phone, customer_email, customer_name, order_id } = req.body;
    try {
        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            return res.status(500).json({ error: 'Cashfree is not configured on this server.' });
        }
        
        const cleanPhone = (customer_phone || '9999999999').replace(/\D/g, '');
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01'
            }
        };
        
        const response = await makeHttpsRequest(`${CASHFREE_BASE_URL}/orders`, options, {
            order_id: order_id || `order_${Math.random().toString(36).substring(2, 15)}`,
            order_amount: Number(amount),
            order_currency: currency || 'INR',
            customer_details: {
                customer_id: customer_id || `cust_${Math.random().toString(36).substring(2, 10)}`,
                customer_phone: cleanPhone.length >= 10 ? cleanPhone : '9999999999',
                customer_email: customer_email || 'guest@vhop.in',
                customer_name: customer_name || 'Guest User'
            }
        });
        
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error creating Cashfree order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Payment Status on Backend (resolves the frontend modal)
app.post('/api/payments/verify', async (req, res) => {
    const { order_id } = req.body;
    try {
        if (!order_id) {
            return res.status(400).json({ error: 'order_id is required' });
        }
        
        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            return res.status(500).json({ error: 'Cashfree is not configured on this server.' });
        }

        const options = {
            method: 'GET',
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01'
            }
        };

        const response = await makeHttpsRequest(`${CASHFREE_BASE_URL}/orders/${order_id}`, options);
        
        if (!response.ok) {
            const err = await response.text();
            console.error(`Error fetching order status from Cashfree for ${order_id}:`, err);
            return res.status(400).json({ error: 'Failed to fetch order status from Cashfree.' });
        }

        const order = await response.json();
        
        if (order.order_status === 'PAID') {
            const result = await confirmBooking(order_id, order.order_id);
            if (result.success) {
                res.status(200).json({ status: 'success', message: 'Payment verified successfully.', booking: result.booking });
            } else {
                res.status(500).json({ error: result.error });
            }
        } else {
            res.status(400).json({ status: 'failure', message: `Order status is ${order.order_status}` });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cashfree Webhook Endpoint
app.post('/api/payments/webhook', async (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    if (!signature || !timestamp) {
        return res.status(400).json({ error: 'Missing x-webhook-signature or x-webhook-timestamp header' });
    }

    // Verify webhook signature using the Client Secret
    const signStr = timestamp + (req.rawBody || '');
    const generatedSignature = crypto
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(signStr)
        .digest('base64');

    if (generatedSignature !== signature) {
        console.error('⚠️ Cashfree Webhook Signature Verification Failed!');
        return res.status(400).json({ error: 'Signature mismatch' });
    }

    try {
        const payload = req.body;
        console.log('🔔 Cashfree Webhook Received event_type:', payload.event_type);

        if (payload.event_type === 'ORDER_PAID' && payload.data && payload.data.order) {
            const orderId = payload.data.order.order_id;
            const paymentId = payload.data.payment ? payload.data.payment.cf_payment_id : orderId;
            
            const result = await confirmBooking(orderId, paymentId.toString());
            if (result.success) {
                console.log(`✅ Webhook successfully confirmed booking ${orderId}`);
            } else {
                console.error(`❌ Webhook failed to confirm booking ${orderId}:`, result.error);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling Cashfree Webhook:', error);
        res.status(500).json({ error: error.message });
    }
});


// --- COUPONS SYSTEM ENDPOINTS ---

// Apply Coupon (public checkout)
app.post('/api/coupons/apply', async (req, res) => {
    const { code, subtotal } = req.body;
    try {
        if (!code) {
            return res.status(400).json({ error: 'Coupon code is required' });
        }
        
        const [rows] = await pool.execute(
            'SELECT * FROM coupons WHERE code = ? AND active = true',
            [code.toUpperCase()]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired coupon code' });
        }
        
        const coupon = rows[0];
        
        if (Number(subtotal) < Number(coupon.min_purchase)) {
            return res.status(400).json({ 
                error: `This coupon requires a minimum purchase of ₹${coupon.min_purchase}` 
            });
        }
        
        let discount = 0;
        if (coupon.discount_type === 'fixed_price') {
            // e.g. ticket for 1 rupee
            discount = Number(subtotal) - Number(coupon.discount_value);
            if (discount < 0) discount = 0; // cannot discount more than subtotal
        } else if (coupon.discount_type === 'fixed') {
            discount = Number(coupon.discount_value);
            if (discount > Number(subtotal)) {
                discount = Number(subtotal);
            }
        } else if (coupon.discount_type === 'percentage') {
            discount = Number(subtotal) * (Number(coupon.discount_value) / 100);
            if (discount > Number(subtotal)) {
                discount = Number(subtotal);
            }
        }
        
        res.status(200).json({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: Number(coupon.discount_value),
            discount: Number(discount.toFixed(2))
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all coupons
app.get('/api/admin/coupons', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching admin coupons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Create/update coupon
app.post('/api/admin/coupons', async (req, res) => {
    const { code, discount_type, discount_value, min_purchase, active } = req.body;
    try {
        if (!code || !discount_type || discount_value === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const upperCode = code.toUpperCase().replace(/\s/g, '');
        
        // Insert or update on duplicate key
        await pool.execute(
            `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, active) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             discount_type = VALUES(discount_type), 
             discount_value = VALUES(discount_value), 
             min_purchase = VALUES(min_purchase), 
             active = VALUES(active)`,
            [upperCode, discount_type, Number(discount_value), Number(min_purchase || 0), active !== false]
        );
        
        res.status(200).json({ message: 'Coupon saved successfully', code: upperCode });
    } catch (error) {
        console.error('Error saving coupon:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete coupon
app.delete('/api/admin/coupons/:code', async (req, res) => {
    const { code } = req.params;
    try {
        await pool.execute('DELETE FROM coupons WHERE code = ?', [code.toUpperCase()]);
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- DYNAMIC SYSTEM FEES ENDPOINTS ---

// Fetch all system settings and genre fees
app.get('/api/settings/fees', async (req, res) => {
    try {
        const [settingsRows] = await pool.execute('SELECT * FROM system_settings');
        const [genreRows] = await pool.execute('SELECT * FROM genre_fees');
        
        const fees = {
            platform_fee: 0.00,
            gst_rate: 0.00,
            high_demand_fee: 0.00,
            genre_fees: genreRows
        };
        
        settingsRows.forEach(row => {
            if (row.setting_key === 'platform_fee') fees.platform_fee = Number(row.setting_value) || 0;
            if (row.setting_key === 'gst_rate') fees.gst_rate = Number(row.setting_value) || 0;
            if (row.setting_key === 'high_demand_fee') fees.high_demand_fee = Number(row.setting_value) || 0;
        });
        
        res.status(200).json(fees);
    } catch (error) {
        console.error('Error fetching system fees:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update global fee settings
app.post('/api/admin/settings/fees', async (req, res) => {
    const { platform_fee, gst_rate, high_demand_fee } = req.body;
    try {
        if (platform_fee !== undefined) {
            await pool.execute(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (\'platform_fee\', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                [platform_fee.toString()]
            );
        }
        if (gst_rate !== undefined) {
            await pool.execute(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (\'gst_rate\', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                [gst_rate.toString()]
            );
        }
        if (high_demand_fee !== undefined) {
            await pool.execute(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (\'high_demand_fee\', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                [high_demand_fee.toString()]
            );
        }
        
        res.status(200).json({ message: 'Global fee settings updated successfully' });
    } catch (error) {
        console.error('Error updating system fees:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create/Update genre fee mapping
app.post('/api/admin/settings/genre-fees', async (req, res) => {
    const { genre, price } = req.body;
    try {
        if (!genre || price === undefined) {
            return res.status(400).json({ error: 'Missing genre or price' });
        }
        
        await pool.execute(
            'INSERT INTO genre_fees (genre, price) VALUES (?, ?) ON DUPLICATE KEY UPDATE price = VALUES(price)',
            [genre, Number(price)]
        );
        
        res.status(200).json({ message: 'Genre fee saved successfully' });
    } catch (error) {
        console.error('Error saving genre fee:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a genre fee mapping
app.delete('/api/admin/settings/genre-fees/:genre', async (req, res) => {
    const { genre } = req.params;
    try {
        await pool.execute('DELETE FROM genre_fees WHERE genre = ?', [genre]);
        res.status(200).json({ message: 'Genre fee deleted successfully' });
    } catch (error) {
        console.error('Error deleting genre fee:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- STATUS & LOGS CONSOLE ---
app.get('/', async (req, res) => {

    let dbStatus = '🟢 Connected';
    let dbError = null;
    try {
        await pool.execute('SELECT 1');
    } catch (err) {
        dbStatus = '🔴 Disconnected';
        dbError = err.message;
    }

    let logs = [];
    try {
        if (fs.existsSync(activityLogPath)) {
            const fileContent = fs.readFileSync(activityLogPath, 'utf8');
            logs = fileContent.trim().split('\n').filter(Boolean).slice(-15).reverse();
        }
    } catch (err) {
        logs = [`Failed to read logs: ${err.message}`];
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VHOP API Status Console</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #0b0914;
                --card-bg: rgba(20, 17, 34, 0.7);
                --violet: #8b5cf6;
                --violet-glow: #a78bfa;
                --green: #10b981;
                --red: #ef4444;
                --text: #f3f4f6;
                --text-muted: #9ca3af;
                --border: rgba(139, 92, 246, 0.15);
            }
            body {
                background-color: var(--bg);
                color: var(--text);
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 40px 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                box-sizing: border-box;
            }
            .container {
                max-width: 900px;
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo {
                font-size: 32px;
                font-weight: 800;
                background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: 2px;
                margin: 0 0 8px 0;
            }
            .subtitle {
                color: var(--text-muted);
                font-size: 14px;
                margin: 0;
            }
            .grid {
                display: grid;
                grid-template-cols: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            .card {
                background: var(--card-bg);
                border: 1px solid var(--border);
                border-radius: 24px;
                padding: 24px;
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            }
            .card-title {
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-muted);
                margin: 0 0 12px 0;
            }
            .stat {
                font-size: 24px;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .stat.green { color: var(--green); }
            .stat.red { color: var(--red); }
            .details {
                font-size: 13px;
                color: var(--text-muted);
                margin-top: 8px;
            }
            .console-card {
                background: rgba(10, 8, 20, 0.95);
                border: 1px solid var(--border);
                border-radius: 24px;
                overflow: hidden;
            }
            .console-header {
                background: rgba(20, 17, 34, 0.9);
                padding: 16px 24px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .console-title {
                font-size: 14px;
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
                color: var(--violet-glow);
            }
            .dot-group {
                display: flex;
                gap: 6px;
            }
            .dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            .dot.r { background: var(--red); }
            .dot.y { background: #fbbf24; }
            .dot.g { background: var(--green); }
            .console-body {
                padding: 24px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                line-height: 1.6;
                overflow-x: auto;
                max-height: 400px;
                overflow-y: auto;
            }
            .log-line {
                margin-bottom: 8px;
                color: #e5e7eb;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                padding-bottom: 6px;
                white-space: pre-wrap;
            }
            .log-time {
                color: var(--violet-glow);
                margin-right: 8px;
            }
            .empty-logs {
                text-align: center;
                color: var(--text-muted);
                padding: 40px 0;
            }
            .btn {
                background: var(--violet);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 12px;
                font-size: 12px;
                font-family: 'Outfit', sans-serif;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn:hover {
                background: #7c3aed;
                transform: translateY(-1px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">VHOP</h1>
                <p class="subtitle">API Server Status Console</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <p class="card-title">Server Status</p>
                    <div class="stat green">🟢 Active</div>
                    <p class="details">Port: ${PORT} | Node.js Environment</p>
                </div>
                <div class="card">
                    <p class="card-title">Database Status</p>
                    <div class="stat ${dbStatus.includes('🟢') ? 'green' : 'red'}">${dbStatus}</div>
                    <p class="details">${dbError ? dbError : 'Successfully connected to database pool'}</p>
                </div>
                <div class="card">
                    <p class="card-title">System Time</p>
                    <div class="stat" style="font-size: 20px;">🕒 ${new Date().toLocaleTimeString('en-US', { hour12: true })}</div>
                    <p class="details">${new Date().toDateString()}</p>
                </div>
            </div>
            
            <div class="console-card">
                <div class="console-header">
                    <div class="console-title">>_ live_system_activity.log</div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn" onclick="window.location.reload()">Refresh Console</button>
                        <div class="dot-group">
                            <div class="dot r"></div>
                            <div class="dot y"></div>
                            <div class="dot g"></div>
                        </div>
                    </div>
                </div>
                <div class="console-body">
                    ${logs.length === 0 ? `
                        <div class="empty-logs">No activity logged yet. Backend is ready to process events.</div>
                    ` : logs.map(line => {
                        const match = line.match(/^\[(.*?)\] (.*)$/);
                        if (match) {
                            const timeStr = new Date(match[1]).toLocaleTimeString('en-US', { hour12: true });
                            return '<div class="log-line"><span class="log-time">[' + timeStr + ']</span><span>' + match[2] + '</span></div>';
                        }
                        return '<div class="log-line">' + line + '</div>';
                    }).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// ==================== CONTACT SUPPORT ====================

// POST /api/contact/submit - Submit a general contact/support message
app.post('/api/contact/submit', async (req, res) => {
    const { name, email, phone, message } = req.body;
    try {
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email and message are required.' });
        }

        const id = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await pool.execute(
            'INSERT INTO contact_messages (id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, phone || null, message]
        );

        logActivity({ type: 'contact_form_submitted', name, email });

        // Notify superadmin via email (non-blocking)
        sendContactFormDetailsToSuperEmail({ name, email, phone, message }).catch(console.error);

        res.status(201).json({ message: 'Your message has been received. We will get back to you shortly!' });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== PARTNER APPLICATIONS ====================

// POST /api/partners/apply - Submit a venue partner application (public)
app.post('/api/partners/apply', async (req, res) => {
    const { full_name, email, phone, company_name, company_city, description } = req.body;
    try {
        if (!full_name || !email || !phone || !company_name || !company_city) {
            return res.status(400).json({ error: 'All required fields must be filled.' });
        }

        // Check if an application with this email already exists
        const [existing] = await pool.execute(
            'SELECT id FROM partner_applications WHERE email = ?',
            [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'A partner application with this email already exists. Please wait for a response.' });
        }

        const id = `partner_app_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await pool.execute(
            'INSERT INTO partner_applications (id, full_name, email, phone, company_name, company_city, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, full_name, email, phone, company_name, company_city, description || null]
        );

        logActivity({ type: 'partner_application_submitted', full_name, email, company_name });

        // Send receipt to applicant (non-blocking)
        sendPartnerReceiptEmail(email, full_name).catch(console.error);

        // Alert superadmin via email (non-blocking)
        sendPartnerNotificationToSuperEmail({ full_name, email, phone, company_name, company_city, description }).catch(console.error);

        res.status(201).json({ message: 'Your application has been submitted successfully! We will review it and get back to you within 48 hours.' });
    } catch (error) {
        console.error('Error saving partner application:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/superadmin/partners/applications - Fetch all partner applications (superadmin only)
app.get('/api/superadmin/partners/applications', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM partner_applications ORDER BY created_at DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching partner applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/superadmin/partners/approve - Approve partner, create credentials, send email
app.post('/api/superadmin/partners/approve', async (req, res) => {
    const { applicationId } = req.body;
    try {
        if (!applicationId) {
            return res.status(400).json({ error: 'applicationId is required.' });
        }

        // Fetch the application
        const [appRows] = await pool.execute(
            'SELECT * FROM partner_applications WHERE id = ?',
            [applicationId]
        );
        if (appRows.length === 0) {
            return res.status(404).json({ error: 'Application not found.' });
        }
        const app_data = appRows[0];

        if (app_data.status === 'approved') {
            return res.status(400).json({ error: 'This application has already been approved.' });
        }

        // Generate credentials
        const adminId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const tempPassword = `VHOP${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
        const companyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const username = app_data.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || `partner_${adminId}`;

        // Create admin profile
        await pool.execute(
            'INSERT INTO profiles (id, full_name, username, email, password, role, v_coins, city, phone, onboarded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [adminId, app_data.full_name, username, app_data.email, tempPassword, 'admin', 500, app_data.company_city, app_data.phone, true]
        );

        // Create company record
        await pool.execute(
            'INSERT INTO companies (id, name, admin_user_id, city, description, verified) VALUES (?, ?, ?, ?, ?, ?)',
            [companyId, app_data.company_name, adminId, app_data.company_city, app_data.description || '', true]
        );

        // Mark application as approved
        await pool.execute(
            'UPDATE partner_applications SET status = ? WHERE id = ?',
            ['approved', applicationId]
        );

        logActivity({ type: 'partner_application_approved', applicationId, email: app_data.email, companyName: app_data.company_name });

        // Send credentials email (non-blocking)
        sendPartnerApprovalCredentialsEmail(app_data.email, app_data.full_name, tempPassword, app_data.company_name).catch(console.error);

        res.status(200).json({
            message: 'Partner approved! Credentials emailed to applicant.',
            credentials: {
                email: app_data.email,
                password: tempPassword,
                companyName: app_data.company_name,
                portalUrl: 'https://vhop.in/admin'
            }
        });
    } catch (error) {
        console.error('Error approving partner application:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/superadmin/partners/reject - Reject a partner application
app.post('/api/superadmin/partners/reject', async (req, res) => {
    const { applicationId } = req.body;
    try {
        if (!applicationId) {
            return res.status(400).json({ error: 'applicationId is required.' });
        }

        const [result] = await pool.execute(
            'UPDATE partner_applications SET status = ? WHERE id = ?',
            ['rejected', applicationId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        logActivity({ type: 'partner_application_rejected', applicationId });
        res.status(200).json({ message: 'Application rejected successfully.' });
    } catch (error) {
        console.error('Error rejecting partner application:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== END PARTNER / CONTACT ROUTES ====================

// ==================== SMS BROADCAST (SUPER ADMIN) ====================

// GET /api/superadmin/sms/templates - Fetch all SMS templates
app.get('/api/superadmin/sms/templates', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM sms_templates ORDER BY created_at ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching SMS templates:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/superadmin/sms/templates - Save or update an SMS template
app.post('/api/superadmin/sms/templates', async (req, res) => {
    const { id, name, body } = req.body;
    if (!name || !body) {
        return res.status(400).json({ error: 'name and body are required' });
    }
    try {
        const templateId = id || `tpl_${Math.random().toString(36).substring(2, 11)}`;
        await pool.execute(
            'INSERT INTO sms_templates (id, name, body) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), body = VALUES(body)',
            [templateId, name, body]
        );
        const [rows] = await pool.execute('SELECT * FROM sms_templates WHERE id = ?', [templateId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error saving SMS template:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/superadmin/sms/templates/:id - Delete an SMS template
app.delete('/api/superadmin/sms/templates/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM sms_templates WHERE id = ?', [req.params.id]);
        res.json({ message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting SMS template:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/superadmin/sms/event-guests - Send SMS to confirmed guests of an event
app.post('/api/superadmin/sms/event-guests', async (req, res) => {
    const { eventId, message } = req.body;
    if (!eventId || !message) {
        return res.status(400).json({ error: 'eventId and message are required' });
    }
    try {
        // Fetch all confirmed bookings for this event with user phone numbers
        const [rows] = await pool.execute(
            `SELECT DISTINCT p.phone, p.full_name
             FROM bookings b
             JOIN profiles p ON b.user_id = p.id
             WHERE b.event_id = ? AND b.booking_status IN ('confirmed', 'checked_in')
             AND p.phone IS NOT NULL AND p.phone != ''`,
            [eventId]
        );

        if (rows.length === 0) {
            return res.json({ message: 'No guests with phone numbers found for this event.', sent: 0, failed: 0 });
        }

        const phones = rows.map(r => r.phone);
        // Fire and respond immediately, send in background
        res.json({ message: `Sending SMS to ${phones.length} guests...`, total: phones.length });

        // Background send
        sendBulkSMS(phones, message).then(result => {
            logActivity({ type: 'sms_broadcast_event', eventId, sent: result.sent, failed: result.failed });
            console.log(`[SMS Broadcast] Event ${eventId}: sent=${result.sent}, failed=${result.failed}`);
        });
    } catch (error) {
        console.error('Error sending event SMS broadcast:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/superadmin/sms/all-users - Broadcast SMS to all registered users
app.post('/api/superadmin/sms/all-users', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }
    try {
        const [rows] = await pool.execute(
            `SELECT DISTINCT phone, full_name FROM profiles
             WHERE role = 'user' AND phone IS NOT NULL AND phone != ''`
        );

        if (rows.length === 0) {
            return res.json({ message: 'No users with phone numbers found.', sent: 0, failed: 0 });
        }

        const phones = rows.map(r => r.phone);
        res.json({ message: `Broadcasting SMS to ${phones.length} users...`, total: phones.length });

        sendBulkSMS(phones, message).then(result => {
            logActivity({ type: 'sms_broadcast_all_users', sent: result.sent, failed: result.failed });
            console.log(`[SMS Broadcast] All users: sent=${result.sent}, failed=${result.failed}`);
        });
    } catch (error) {
        console.error('Error sending all-users SMS broadcast:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/superadmin/sms/event-guest-count/:eventId - Preview recipient count
app.get('/api/superadmin/sms/event-guest-count/:eventId', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(DISTINCT p.id) as count
             FROM bookings b
             JOIN profiles p ON b.user_id = p.id
             WHERE b.event_id = ? AND b.booking_status IN ('confirmed', 'checked_in')
             AND p.phone IS NOT NULL AND p.phone != ''`,
            [req.params.eventId]
        );
        res.json({ count: rows[0].count || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/superadmin/sms/user-count - Preview all-users recipient count
app.get('/api/superadmin/sms/user-count', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as count FROM profiles
             WHERE role = 'user' AND phone IS NOT NULL AND phone != ''`
        );
        res.json({ count: rows[0].count || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== END SMS BROADCAST ====================

// Logging endpoint
app.post('/api/log', (req, res) => {
    const { type, user, details } = req.body;
    const logData = { type, user: user || 'anonymous', details: details || {}, ip: req.ip };
    logActivity(logData);
    res.status(200).json({ message: 'Logged' });
});

app.listen(PORT, () => {
    console.log(`VHOP MySQL Backend running on port ${PORT}`);
});
