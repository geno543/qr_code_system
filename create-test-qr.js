const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Create directories
const publicDir = path.join(__dirname, 'public');
const qrDir = path.join(publicDir, 'qr');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

// Create a test QR code
const testToken = 'test-token-123';
const qrData = JSON.stringify({ token: testToken });
const qrFilePath = path.join(qrDir, 'test-qr.png');

QRCode.toFile(qrFilePath, qrData, {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
        dark: '#000000',
        light: '#FFFFFF'
    },
    width: 256
}).then(() => {
    console.log('Test QR code created at: public/qr/test-qr.png');
    console.log('QR code contains:', qrData);
    console.log('You can access it at: http://localhost:3000/qr/test-qr.png');
    console.log('Note: This test QR code will NOT validate since it\'s not in the database');
    console.log('Use it to test if the scanner detects QR codes at all');
}).catch(err => {
    console.error('Error creating test QR:', err);
});
