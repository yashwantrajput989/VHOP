const https = require('https');

const AUTH_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUMyMUYyMUE5N0E2MjRGOSIsImlhdCI6MTc4MTQ2MDY2NCwiZXhwIjoxOTM5MTQwNjY0fQ.NK8Zh9zsjkanICBnRdk3Lhd4fVHW2p00duNpY2YKa_SAKrq9pwrikJW79fMxILcUGZI656SBJdKskShTFVji7Q';
const SENDER_ID = 'C-C21F21A97A624F9';
const COUNTRY_CODE = '91';
const MC_HOST = 'cpaas.messagecentral.com';

function sendSMS(mobileNo, message) {
    const params = new URLSearchParams({
        countryCode: COUNTRY_CODE,
        flowType: 'SMS',
        mobileNumber: mobileNo,
        senderId: SENDER_ID,
        message: message
    });
    const path = `/verification/v3/send?${params.toString()}`;
    
    return new Promise((resolve) => {
        const options = {
            hostname: MC_HOST,
            path,
            method: 'POST',
            headers: {
                'authToken': AUTH_TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': 0
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, error: body });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ error: err.message });
        });

        req.end();
    });
}

function validateOTP(verificationId, code, method = 'POST') {
    const path = `/verification/v3/validateOtp?verificationId=${encodeURIComponent(verificationId)}&code=${encodeURIComponent(code)}`;
    
    return new Promise((resolve) => {
        const options = {
            hostname: MC_HOST,
            path,
            method: method,
            headers: {
                'authToken': AUTH_TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': 0
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, data });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, error: body });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ error: err.message });
        });

        req.end();
    });
}

async function run() {
    console.log('--- SENDING OTP ---');
    // Using a fake 10-digit number that will fail or succeed at API level
    const sendRes = await sendSMS('9999999999', '[VHOP] Your OTP for secure login is ##OTP##. Valid for 10 minutes. Please do not share this code. 🎶');
    console.log('Send Response:', JSON.stringify(sendRes, null, 2));

    const verificationId = sendRes.data && sendRes.data.data && sendRes.data.data.verificationId;
    if (verificationId) {
        console.log('\n--- VALIDATING OTP WITH POST ---');
        const valPost = await validateOTP(verificationId, '1234', 'POST');
        console.log('POST Validation Response:', JSON.stringify(valPost, null, 2));

        console.log('\n--- VALIDATING OTP WITH GET ---');
        const valGet = await validateOTP(verificationId, '1234', 'GET');
        console.log('GET Validation Response:', JSON.stringify(valGet, null, 2));
    } else {
        console.log('Could not test verification because sending failed or returned no verificationId.');
    }
}

run();
