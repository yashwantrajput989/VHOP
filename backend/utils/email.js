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

/**
 * Sends a password reset verification email with a 6-digit OTP code
 * @param {string} userEmail - Recipient's email
 * @param {string} otp - The 6-digit verification code
 */
const sendResetEmail = async (userEmail, otp) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            return;
        }

        const mailOptions = {
            from: `"VHOP Accounts" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Password Reset Verification Code: ${otp} 🔒`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; color: #ffffff;">VHOP</h1>
                        <p style="margin-top: 10px; font-weight: 500; opacity: 0.9; color: #ffffff;">Password Reset Request</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px; text-align: center;">Reset Your Password</h2>
                        
                        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center;">
                            We received a request to reset the password for your VHOP account. 
                            Use the verification code (OTP) below to complete your reset. This code is valid for 15 minutes.
                        </p>

                        <div style="text-align: center; background-color: #161618; border-radius: 15px; padding: 20px 30px; margin: 30px auto; border: 1px solid #27272a; width: fit-content;">
                            <span style="font-family: monospace; font-size: 36px; letter-spacing: 6px; font-weight: bold; color: #7c3aed;">${otp}</span>
                        </div>

                        <p style="color: #71717a; font-size: 13px; text-align: center; margin-bottom: 30px;">
                            If you did not request this, you can safely ignore this email. Your password will remain unchanged.
                        </p>

                        <div style="text-align: center; color: #a1a1aa; font-size: 14px;">
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;">
                            <p style="font-size: 12px; color: #71717a;">VHOP - The Ultimate Live Experience Platform</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Reset email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending reset email:', error);
        throw error;
    }
};

/**
 * Sends an email receipt confirming a partner application has been received
 */
const sendPartnerReceiptEmail = async (email, name) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            // Development logging so we can see what would be sent:
            console.log(`[DEVELOPMENT ONLY] Partner receipt confirmation would be sent to: ${email}`);
            return;
        }

        const mailOptions = {
            from: `"VHOP Partnerships" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `We've Received Your Partner Application! 🤝`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; color: #ffffff;">VHOP</h1>
                        <p style="margin-top: 10px; font-weight: 500; opacity: 0.9; color: #ffffff;">Partnership Application Receipt</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px;">Hi ${name},</h2>
                        
                        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                            Thank you for applying to become a VHOP Venue Partner! We have successfully received your application.
                        </p>

                        <div style="background-color: #161618; border-radius: 15px; padding: 20px; border: 1px solid #27272a; margin: 25px 0;">
                            <h3 style="color: #7c3aed; margin-top: 0; margin-bottom: 10px;">Application Status: Pending Review</h3>
                            <p style="color: #e4e4e7; font-size: 14px; margin: 0; line-height: 1.5;">
                                Our global administration team is currently reviewing your details. Please stay patient until our admin reviews and approves your request. This process usually takes 24-48 hours.
                            </p>
                        </div>

                        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                            Once approved, you will receive an automated email containing your partner credentials and portal login links to start hosting high-vibe premium events.
                        </p>

                        <div style="text-align: center; color: #a1a1aa; font-size: 14px;">
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;">
                            <p style="font-size: 12px; color: #71717a;">VHOP - The Ultimate Live Experience Platform</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Partner receipt email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending partner receipt email:', error);
        throw error;
    }
};

/**
 * Sends a notification email to Super Admin about a new partner application
 */
const sendPartnerNotificationToSuperEmail = async (appData) => {
    try {
        const superEmail = 'superadmin@vhop.in';
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            // Development logging
            console.log(`[DEVELOPMENT ONLY] Super Admin alert: New Partner Application from ${appData.full_name} (${appData.email}) for ${appData.company_name}`);
            return;
        }

        const mailOptions = {
            from: `"VHOP System Alerts" <${process.env.EMAIL_USER}>`,
            to: superEmail,
            subject: `🚨 Alert: New Partner Application - ${appData.company_name}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: #dc2626; padding: 30px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; color: #ffffff;">VHOP ALERTS</h1>
                        <p style="margin-top: 5px; font-weight: 500; opacity: 0.9; color: #ffffff;">New Venue Partner Application Received</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px;">Review Partnership Application</h2>
                        
                        <div style="background-color: #161618; border-radius: 15px; padding: 20px; border: 1px solid #27272a; margin-bottom: 25px;">
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Applicant Name:</strong> ${appData.full_name}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Email Address:</strong> ${appData.email}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Phone Number:</strong> ${appData.phone}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Company/Venue:</strong> ${appData.company_name}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Operating City:</strong> ${appData.company_city}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Description:</strong> ${appData.description || 'No description provided.'}</p>
                        </div>

                        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
                            Please log in to your Super Admin Dashboard at <a href="https://vhop.in/superadmin" style="color: #7c3aed; text-decoration: none; font-weight: bold;">vhop.in/superadmin</a> to approve or reject this request.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Partner alert email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending partner alert email:', error);
        throw error;
    }
};

/**
 * Sends the generated login credentials to an approved partner
 */
const sendPartnerApprovalCredentialsEmail = async (email, name, password, companyName) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            // Development logging
            console.log(`[DEVELOPMENT ONLY] Credentials email would be sent to: ${email}`);
            console.log(`[DEVELOPMENT ONLY] Portal: vhop.in/admin | Email: ${email} | Password: ${password} | Company: ${companyName}`);
            return;
        }

        const mailOptions = {
            from: `"VHOP Partnerships" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎉 Congratulations! Your VHOP Partner Application is Approved!`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; color: #ffffff;">APPROVED</h1>
                        <p style="margin-top: 10px; font-weight: 500; opacity: 0.9; color: #ffffff;">Welcome to the VHOP Partner Ecosystem!</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px;">Hi ${name},</h2>
                        
                        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                            We are absolutely thrilled to inform you that your application for <strong>${companyName}</strong> has been officially approved by the Super Admin!
                        </p>

                        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                            Your credentials have been securely generated. Use them to log in to the partner administration portal and start publishing your premium vertical gigs.
                        </p>

                        <div style="background-color: #161618; border-radius: 15px; padding: 25px; border: 1px solid #27272a; margin: 25px 0;">
                            <h3 style="color: #10b981; margin-top: 0; margin-bottom: 15px;">Your Admin Account Details</h3>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Admin Portal URL:</strong> <a href="https://vhop.in/admin" style="color: #06b6d4; font-weight: bold; text-decoration: underline;">vhop.in/admin</a></p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Sign-in Email:</strong> <span style="font-family: monospace; background: #000; padding: 2px 6px; border-radius: 4px;">${email}</span></p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #000; padding: 2px 6px; border-radius: 4px; color: #10b981; font-weight: bold;">${password}</span></p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Associated Partner Brand:</strong> ${companyName}</p>
                        </div>

                        <p style="color: #71717a; font-size: 12px; line-height: 1.5; text-align: center; margin-bottom: 20px;">
                            We highly recommend changing this temporary password in the settings panel after your initial login.
                        </p>

                        <div style="text-align: center; color: #a1a1aa; font-size: 14px;">
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;">
                            <p style="font-size: 12px; color: #71717a;">VHOP - The Ultimate Live Experience Platform</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Partner credentials delivery email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending partner credentials delivery email:', error);
        throw error;
    }
};

/**
 * Sends the details submitted through the contact support form to the Super Admin
 */
const sendContactFormDetailsToSuperEmail = async (contactData) => {
    try {
        const superEmail = 'superadmin@vhop.in';
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            // Development logging
            console.log(`[DEVELOPMENT ONLY] Super Admin alert: New Guest Support message from ${contactData.name} (${contactData.email}): "${contactData.message}"`);
            return;
        }

        const mailOptions = {
            from: `"VHOP Guest Support" <${process.env.EMAIL_USER}>`,
            to: superEmail,
            subject: `✉️ New Contact Message from ${contactData.name}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: #3b82f6; padding: 30px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; color: #ffffff;">SUPPORT</h1>
                        <p style="margin-top: 5px; font-weight: 500; opacity: 0.9; color: #ffffff;">New Customer Contact Submission</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px;">Guest Message Details</h2>
                        
                        <div style="background-color: #161618; border-radius: 15px; padding: 20px; border: 1px solid #27272a; margin-bottom: 25px;">
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Sender Name:</strong> ${contactData.name}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> ${contactData.email}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 15px 0;">
                            <p style="margin: 8px 0; font-size: 14px; line-height: 1.5; color: #e4e4e7;"><strong>Message Body:</strong><br>${contactData.message}</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Contact message alert email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending contact message alert email:', error);
        throw error;
    }
};

/**
 * Sends an email verification code (OTP)
 * @param {string} userEmail - Recipient's email
 * @param {string} otp - The 6-digit verification code
 */
const sendVerificationEmail = async (userEmail, otp) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            return;
        }

        const mailOptions = {
            from: `"VHOP Accounts" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Verify Your Email: ${otp} 🔑`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; color: #ffffff;">VHOP</h1>
                        <p style="margin-top: 10px; font-weight: 500; opacity: 0.9; color: #ffffff;">Account Verification</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px; text-align: center;">Verify Your Email Address</h2>
                        
                        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; text-align: center;">
                            Use the verification code (OTP) below to verify your email address. This code is valid for 10 minutes.
                        </p>

                        <div style="text-align: center; background-color: #161618; border-radius: 15px; padding: 20px 30px; margin: 30px auto; border: 1px solid #27272a; width: fit-content;">
                            <span style="font-family: monospace; font-size: 36px; letter-spacing: 6px; font-weight: bold; color: #7c3aed;">${otp}</span>
                        </div>

                        <p style="color: #71717a; font-size: 13px; text-align: center; margin-bottom: 30px;">
                            If you did not request this, you can safely ignore this email.
                        </p>

                        <div style="text-align: center; color: #a1a1aa; font-size: 14px;">
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;">
                            <p style="font-size: 12px; color: #71717a;">VHOP - The Ultimate Live Experience Platform</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

/**
 * Sends a squad join confirmation email to a user
 * @param {Object} memberData - Details of the member joining (full_name)
 * @param {Object} squadData - Details of the squad (name, entry_price)
 * @param {Object} eventData - Details of the event (title, start_date, venue_name, city)
 * @param {string} userEmail - Recipient email
 * @param {string} paymentId - Transaction or payment ID
 */
const sendSquadJoinEmail = async (memberData, squadData, eventData, userEmail, paymentId) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            return;
        }

        const date = new Date(eventData.start_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const entryPrice = Number(squadData.entry_price);
        const entryPriceText = entryPrice > 0 ? `₹${entryPrice.toLocaleString('en-IN')}` : 'Free';

        const mailOptions = {
            from: `"VHOP Squads" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Squad Joined: Welcome to ${squadData.name}! 🚀`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0b; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1f1f23;">
                    <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; color: #ffffff;">VHOP SQUADS</h1>
                        <p style="margin-top: 10px; font-weight: 500; opacity: 0.9; color: #ffffff;">You are in the squad!</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <h2 style="color: #ffffff; margin-bottom: 20px;">Hey ${memberData.full_name || 'Vibester'},</h2>
                        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                            Your payment was received, and you have successfully joined the squad <strong>${squadData.name}</strong>! Get ready for an epic night.
                        </p>
                        
                        <div style="background-color: #161618; border-radius: 15px; padding: 20px; margin-bottom: 30px; border: 1px solid #27272a;">
                            <h3 style="color: #a855f7; margin-top: 0; margin-bottom: 15px;">Squad & Event Details</h3>
                            <p style="margin: 8px 0; color: #ffffff;"><strong>Squad Name:</strong> ${squadData.name}</p>
                            <p style="margin: 8px 0; color: #ffffff;"><strong>Event:</strong> ${eventData.title}</p>
                            <p style="margin: 8px 0; color: #ffffff;"><strong>Date:</strong> ${date}</p>
                            <p style="margin: 8px 0; color: #ffffff;"><strong>Venue:</strong> ${eventData.venue_name}, ${eventData.city}</p>
                            <p style="margin: 8px 0; color: #ffffff;"><strong>Entry Price:</strong> ${entryPriceText}</p>
                            ${paymentId ? `<p style="margin: 8px 0; color: #ffffff;"><strong>Payment ID:</strong> <span style="font-family: monospace; background: #000; padding: 2px 6px; border-radius: 4px;">${paymentId}</span></p>` : ''}
                        </div>

                        <div style="text-align: center; color: #a1a1aa; font-size: 14px;">
                            <p>Coordinate with your squad members inside the app chat and make the night unforgettable!</p>
                            <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;">
                            <p style="font-size: 12px; color: #71717a;">VHOP - The Ultimate Live Experience Platform</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Squad join email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending squad join email:', error);
        throw error;
    }
};

module.exports = { 
    sendBookingEmail, 
    sendResetEmail,
    sendPartnerReceiptEmail,
    sendPartnerNotificationToSuperEmail,
    sendPartnerApprovalCredentialsEmail,
    sendContactFormDetailsToSuperEmail,
    sendVerificationEmail,
    sendSquadJoinEmail
};
