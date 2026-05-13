const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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

// Routes
app.post('/api/log', (req, res) => {
    const { type, user, details } = req.body;
    
    if (!type) {
        return res.status(400).json({ error: 'Log type is required' });
    }

    const logData = {
        type,
        user: user || 'anonymous',
        details: details || {},
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    logActivity(logData);
    res.status(200).json({ message: 'Logged successfully' });
});

// GET route to view logs (for debugging)
app.get('/api/logs', (req, res) => {
    if (fs.existsSync(activityLogPath)) {
        const logs = fs.readFileSync(activityLogPath, 'utf8');
        res.send(`<pre>${logs}</pre>`);
    } else {
        res.send('No logs found.');
    }
});

app.listen(PORT, () => {
    console.log(`Backend Logging Server running on http://localhost:${PORT}`);
});
