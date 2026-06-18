require('dotenv').config({ path: 'c:/Users/Yashwanth Singh R/Desktop/Myapps/VHOP/backend/.env' });
const { sendSMS, validateOTP } = require('../utils/sms.js');

async function run() {
    console.log('--- TESTING REAL MODULE ---');
    console.log('Auth Token configured:', !!process.env.MSG_CENTRAL_AUTH_TOKEN);
    console.log('Sender ID:', process.env.MSG_CENTRAL_SENDER_ID);

    // Generate a random 10-digit number starting with 9
    const randomPhone = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
    console.log(`Using randomized phone number: ${randomPhone}`);
    
    // 1. Send SMS
    const sendRes = await sendSMS(randomPhone, '[VHOP] Your OTP for secure login is ##OTP##. Valid for 10 minutes. Please do not share this code. 🎶');
    console.log('Send Response:', JSON.stringify(sendRes, null, 2));

    const verificationId = sendRes.data && sendRes.data.data && sendRes.data.data.verificationId;
    if (verificationId) {
        console.log(`\nVerification ID obtained: ${verificationId}`);
        // 2. Validate OTP with wrong code to test success/failure parsing logic
        console.log('Validating with WRONG code...');
        const valRes = await validateOTP(verificationId, '1234');
        console.log('Validation Result (Expected fail with WRONG_OTP_PROVIDED):', JSON.stringify(valRes, null, 2));
    } else {
        console.log('Failed to get verificationId. Cannot test validateOTP.');
    }
}

run();
