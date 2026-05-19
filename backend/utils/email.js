const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');

// Configure the transporter
// Note: For Gmail, you need to use an "App Password" if you have 2FA enabled.
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a booking confirmation email with a QR code
 * @param {Object} bookingData - Details of the booking
 * @param {Object} eventData - Details of the event
 * @param {string} userEmail - Recipient's email
 */
const sendBookingEmail = async (bookingData, eventData, userEmail) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            return;
        }

        // Generate QR Code as Buffer
        // We'll encode the booking ID or the custom booking_id
        const qrContent = bookingData.booking_id || bookingData.id;
        const qrBuffer = await QRCode.toBuffer(qrContent, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        const date = new Date(eventData.start_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const mailOptions = {
            from: `"VHOP Events" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Booking Confirmed: ${eventData.title} - see you there! 🎟️`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">VHOP</h1>
                        <p style="margin-top: 10px; font-weight: 500; opacity: 0.9;">Your ticket is ready!</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px;">See you there, ${bookingData.user_name || 'Event Goer'}!</h2>
                        
                        <div style="background-color: #161618; border-radius: 15px; padding: 20px; margin-bottom: 30px; border: 1px solid #27272a;">
                            <h3 style="color: #7c3aed; margin-top: 0;">${eventData.title}</h3>
                            <p style="margin: 10px 0;"><strong>Date:</strong> ${date}</p>
                            <p style="margin: 10px 0;"><strong>Venue:</strong> ${eventData.venue_name}, ${eventData.city}</p>
                            <p style="margin: 10px 0;"><strong>Ticket:</strong> ${bookingData.ticket_name} (x${bookingData.quantity})</p>
                            <p style="margin: 10px 0;"><strong>Booking ID:</strong> <span style="font-family: monospace; background: #000; padding: 2px 6px; border-radius: 4px;">${qrContent}</span></p>
                        </div>

                        <div style="text-align: center; background: white; padding: 20px; border-radius: 15px; width: fit-content; margin: 0 auto 30px;">
                            <img src="cid:qrcode" alt="Booking QR Code" style="width: 200px; height: 200px; display: block;" />
                            <p style="color: #000; margin-top: 10px; font-size: 12px; font-weight: bold;">SCAN AT ENTRY</p>
                        </div>

                        <div style="text-align: center; color: #a1a1aa; font-size: 14px;">
                            <p>Please have this QR code ready at the entrance for a seamless entry.</p>
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;">
                            <p style="font-size: 12px;">VHOP - The Ultimate Live Experience Platform</p>
                        </div>
                    </div>
                </div>
            `,
            attachments: [{
                filename: 'qrcode.png',
                content: qrBuffer,
                cid: 'qrcode' // same as in the img src above
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
};

module.exports = { sendBookingEmail };
