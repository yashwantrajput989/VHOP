const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const multer = require('multer');
const { sendBookingEmail } = require('./utils/email');

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
    origin: ['https://vhop.in', 'https://www.vhop.in', 'http://localhost:5173'], // Production and local dev
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const { id, full_name, username, email, avatar_url, role, v_coins, city, phone } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);

        if (rows.length === 0) {
            // Create new profile
            await pool.execute(
                'INSERT INTO profiles (id, full_name, username, email, avatar_url, role, v_coins, city, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, full_name, username, email, avatar_url, role || 'user', v_coins || 500, city || 'Mumbai', phone || '']
            );
            logActivity({ type: 'profile_created', userId: id });
            return res.status(201).json({ message: 'Profile created', onboarded: false });
        } else {
            // Update existing profile
            await pool.execute(
                'UPDATE profiles SET full_name = ?, avatar_url = ?, city = ? WHERE id = ?',
                [full_name, avatar_url, city, id]
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

// --- EVENTS ---

// Get all events
app.get('/api/events', async (req, res) => {
    const { city } = req.query;
    try {
        let sql = 'SELECT * FROM events WHERE status = "published"';
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
            'INSERT INTO events (id, company_id, title, short_description, description, venue_name, city, category, price, cover_image, start_date, ticket_types, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, event.company_id, event.title, event.short_description, event.description, event.venue_name, event.city, event.category, event.price, event.cover_image, event.start_date, JSON.stringify(event.ticket_types), 'published']
        );
        res.status(201).json({ id, message: 'Event created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
    try {
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
        // Start Transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insert Booking
            await connection.execute(
                'INSERT INTO bookings (id, event_id, user_id, quantity, total_amount, ticket_name, price, payment_id, payment_status, booking_id, qr_code, guests) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, booking.event_id, booking.user_id, booking.quantity, booking.total_amount, booking.ticket_name, booking.price, booking.payment_id, 'paid', booking.booking_id, booking.qr_code, JSON.stringify(booking.guests)]
            );

            // 2. Update Event ticket count
            await connection.execute(
                'UPDATE events SET tickets_sold = tickets_sold + ? WHERE id = ?',
                [booking.quantity, booking.event_id]
            );

            await connection.commit();
            
            // Send Email Notification in background (don't block the response)
            // Fetch necessary details for the email
            (async () => {
                try {
                    const [userRows] = await pool.execute('SELECT email, full_name FROM profiles WHERE id = ?', [booking.user_id]);
                    const [eventRows] = await pool.execute('SELECT * FROM events WHERE id = ?', [booking.event_id]);
                    
                    if (userRows.length > 0 && eventRows.length > 0) {
                        await sendBookingEmail(
                            { ...booking, id, user_name: userRows[0].full_name },
                            eventRows[0],
                            userRows[0].email
                        );
                    }
                } catch (emailErr) {
                    console.error('Background Email Error:', emailErr);
                }
            })();

            res.status(201).json({ id, message: 'Booking confirmed' });
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

// Get user bookings
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT b.*, e.title as event_title, e.cover_image, e.venue_name, e.city, e.start_date FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.user_id = ?',
            [req.params.userId]
        );
        res.json(rows);
    } catch (error) {
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

// Get admin dashboard data
app.get('/api/admin/dashboard/:userId', async (req, res) => {
    try {
        // 1. Get company
        // Fetch company and events in parallel for better performance
        const [companies] = await pool.execute('SELECT * FROM companies WHERE admin_user_id = ?', [req.params.userId]);

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

// --- LOGGING ---

app.post('/api/log', (req, res) => {
    const { type, user, details } = req.body;
    const logData = { type, user: user || 'anonymous', details: details || {}, ip: req.ip };
    logActivity(logData);
    res.status(200).json({ message: 'Logged' });
});

app.listen(PORT, () => {
    console.log(`VHOP MySQL Backend running on port ${PORT}`);
});
