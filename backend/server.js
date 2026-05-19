const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const multer = require('multer');
const { sendBookingEmail } = require('./utils/email');
const Razorpay = require('razorpay');
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

// --- RAZORPAY INTEGRATION ---
let razorpay = null;
try {
    if (process.env.RAZORPAY_KEY_ID) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET || ''
        });
        console.log('🟢 Razorpay initialized successfully.');
    } else {
        console.warn('⚠️ Razorpay initialization skipped: RAZORPAY_KEY_ID is missing in environment variables.');
    }
} catch (error) {
    console.error('🔴 Razorpay initialization failed:', error.message);
}

// Create Razorpay Order
app.post('/api/payments/order', async (req, res) => {
    const { amount, currency } = req.body;
    try {
        if (!razorpay) {
            return res.status(500).json({ error: 'Razorpay is not configured on this server. Please set RAZORPAY_KEY_ID in environment variables.' });
        }
        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency: currency || 'INR',
            receipt: `rcpt_${Math.random().toString(36).substring(2, 15)}`
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Payment Signature
app.post('/api/payments/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

    if (generated_signature === razorpay_signature) {
        res.status(200).json({ status: 'success', message: 'Payment verified successfully' });
    } else {
        res.status(400).json({ status: 'failure', message: 'Signature verification failed' });
    }
});

// Razorpay Webhook Endpoint
app.post('/api/payments/webhook', async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (!signature) {
        return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    // Verify signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        console.error('⚠️ Webhook Signature Verification Failed!');
        return res.status(400).json({ error: 'Signature mismatch' });
    }

    const event = req.body.event;
    console.log(`🔔 Razorpay Webhook Event: ${event}`);

    if (event === 'order.paid' || event === 'payment.captured') {
        const paymentEntity = req.body.payload.payment.entity;
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const amount = paymentEntity.amount / 100;
        
        logActivity({ type: 'webhook_payment_received', orderId, paymentId, amount });
    }

    res.status(200).json({ status: 'ok' });
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
