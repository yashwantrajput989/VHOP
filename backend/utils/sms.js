/**
 * VHOP SMS Utility — Message Central Integration
 * Uses Node's built-in https module (no external packages).
 * Docs: https://docs.messagecentral.com
 */

const https = require('https');

const AUTH_TOKEN    = process.env.MSG_CENTRAL_AUTH_TOKEN || '';
const SENDER_ID     = process.env.MSG_CENTRAL_SENDER_ID  || 'VHOPID';
const COUNTRY_CODE  = process.env.MSG_CENTRAL_COUNTRY_CODE || '91';

// Message Central API base
const MC_HOST   = 'cpaas.messagecentral.com';
const MC_PATH   = '/verification/v3/send';

/**
 * Send a single SMS via Message Central.
 * @param {string} phone  - E.164 or 10-digit mobile number (digits only)
 * @param {string} message - Plain text message (keep ≤160 chars for 1 SMS unit)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function sendSMS(phone, message) {
    if (!AUTH_TOKEN) {
        console.warn('[SMS] MSG_CENTRAL_AUTH_TOKEN is not set. Skipping SMS send.');
        return { success: false, error: 'AUTH_TOKEN not configured' };
    }

    // Sanitise phone — digits only, strip leading country code if present
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length < 10) {
        console.warn(`[SMS] Invalid phone number: ${phone}. Skipping.`);
        return { success: false, error: 'Invalid phone number' };
    }
    // Use last 10 digits for country-code-prefixed numbers
    const mobileNo = digits.slice(-10);

    // Build query string
    const params = new URLSearchParams({
        countryCode: COUNTRY_CODE,
        flowType:    'SMS',
        mobileNumber: mobileNo,
        senderId:    SENDER_ID,
        message:     message
    });

    const path = `${MC_PATH}?${params.toString()}`;

    return new Promise((resolve) => {
        const options = {
            hostname: MC_HOST,
            path,
            method: 'POST',
            headers: {
                'authToken':     AUTH_TOKEN,
                'Content-Type':  'application/json',
                'Content-Length': 0
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`[SMS] Sent to +${COUNTRY_CODE}${mobileNo}: ${message.substring(0, 40)}...`);
                        resolve({ success: true, data });
                    } else {
                        console.error(`[SMS] Failed (${res.statusCode}):`, body);
                        resolve({ success: false, error: body, statusCode: res.statusCode });
                    }
                } catch (e) {
                    resolve({ success: false, error: body });
                }
            });
        });

        req.on('error', (err) => {
            console.error('[SMS] Request error:', err.message);
            resolve({ success: false, error: err.message });
        });

        req.end();
    });
}

/**
 * Send SMS to multiple phone numbers (batched, non-blocking fire-and-forget).
 * @param {string[]} phones   - Array of phone numbers
 * @param {string}   message  - Text message
 * @returns {Promise<{sent: number, failed: number}>}
 */
async function sendBulkSMS(phones, message) {
    let sent = 0, failed = 0;
    for (const phone of phones) {
        const result = await sendSMS(phone, message);
        if (result.success) sent++;
        else failed++;
        // Small delay to be respectful to the rate limit
        await new Promise(r => setTimeout(r, 100));
    }
    console.log(`[SMS] Bulk send complete. Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
}

/**
 * Build the standard booking confirmation message.
 */
function buildBookingConfirmationSMS({ userName, eventTitle, bookingId, venueName, city, startDate, quantity, totalAmount }) {
    const dateStr = startDate ? new Date(startDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'TBD';

    return [
        `Hi ${userName || 'there'}! Your VHOP ticket is confirmed 🎉`,
        `Event: ${eventTitle}`,
        `Booking ID: ${bookingId}`,
        `Venue: ${venueName}, ${city}`,
        `Date: ${dateStr}`,
        `Qty: ${quantity} ticket(s) | Total: Rs.${Number(totalAmount).toFixed(2)}`,
        `Show this SMS or QR code at entry. Enjoy! 🎶`
    ].join('\n');
}

/**
 * Validate an OTP code via Message Central.
 * @param {string} verificationId 
 * @param {string} code 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function validateOTP(verificationId, code) {
    if (!AUTH_TOKEN) {
        return { success: false, error: 'AUTH_TOKEN not configured' };
    }

    const path = `/verification/v3/validateOtp?verificationId=${encodeURIComponent(verificationId)}&code=${encodeURIComponent(code)}`;

    return new Promise((resolve) => {
        const options = {
            hostname: MC_HOST,
            path,
            method: 'POST',
            headers: {
                'authToken':     AUTH_TOKEN,
                'Content-Type':  'application/json',
                'Content-Length': 0
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        // Message Central V3 response format checks
                        if (data.status === 200 || data.responseCode === 200 || data.message === 'Verification Success' || data.message === 'Approved') {
                            resolve({ success: true, data });
                        } else {
                            resolve({ success: false, error: data.message || 'OTP verification failed' });
                        }
                    } else {
                        resolve({ success: false, error: data.message || body });
                    }
                } catch (e) {
                    resolve({ success: false, error: body });
                }
            });
        });

        req.on('error', (err) => {
            console.error('[SMS] validateOTP request error:', err.message);
            resolve({ success: false, error: err.message });
        });

        req.end();
    });
}

module.exports = { sendSMS, sendBulkSMS, buildBookingConfirmationSMS, validateOTP };
