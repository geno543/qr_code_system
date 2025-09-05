const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const db = new sqlite3.Database('./event.db');

// Get all attendees who need QR codes generated
db.all('SELECT * FROM attendees', async (err, attendees) => {
    if (err) {
        console.error('Database error:', err);
        return;
    }

    console.log(`Generating QR codes for ${attendees.length} attendees...`);
    
    let count = 0;
    for (const attendee of attendees) {
        try {
            // Create QR code data
            const qrData = JSON.stringify({ token: attendee.qr_token });
            
            // Generate QR code file path
            const qrFileName = `${attendee.qr_token}.png`;
            const qrFilePath = path.join(__dirname, 'public', 'qr', 'qr-codes', qrFileName);
            
            // Generate QR code
            await QRCode.toFile(qrFilePath, qrData, {
                errorCorrectionLevel: 'M',
                type: 'png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 256
            });
            
            count++;
            console.log(`Generated ${count}/${attendees.length}: ${attendee.name}`);
            
        } catch (error) {
            console.error(`Error generating QR for ${attendee.name}:`, error);
        }
    }
    
    console.log(`\nCompleted! Generated ${count} QR codes.`);
    console.log('QR codes saved in: public/qr/qr-codes/');
    console.log('You can now test the scanner at: http://localhost:3000/scanner');
    
    db.close();
});
