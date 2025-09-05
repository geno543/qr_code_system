const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Create database and add test attendees
const db = new sqlite3.Database('./event.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ticket_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        qr_token TEXT UNIQUE NOT NULL,
        qr_code_path TEXT,
        photo_path TEXT,
        is_scanned INTEGER DEFAULT 0,
        scan_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add 3 test attendees
    const testAttendees = [
        { name: 'John Doe', ticket_id: 'TEST-001', email: 'john@test.com' },
        { name: 'Jane Smith', ticket_id: 'TEST-002', email: 'jane@test.com' },
        { name: 'Bob Johnson', ticket_id: 'TEST-003', email: 'bob@test.com' }
    ];

    console.log('Creating test attendees...');
    
    testAttendees.forEach(async (attendee, index) => {
        const qrToken = uuidv4();
        const qrPath = `qr-codes/${qrToken}.png`;
        
        // Insert attendee
        db.run(
            `INSERT INTO attendees (name, ticket_id, email, qr_token, qr_code_path) 
             VALUES (?, ?, ?, ?, ?)`,
            [attendee.name, attendee.ticket_id, attendee.email, qrToken, qrPath],
            function(err) {
                if (err) {
                    console.error('Error inserting attendee:', err);
                    return;
                }
                
                console.log(`Added: ${attendee.name} (${attendee.ticket_id})`);
                
                // Generate QR code
                generateQRCode(qrToken, qrPath);
            }
        );
    });
});

async function generateQRCode(token, filePath) {
    try {
        // Create directories if they don't exist
        const publicDir = path.join(__dirname, 'public');
        const qrDir = path.join(publicDir, 'qr');
        const qrCodesDir = path.join(qrDir, 'qr-codes');
        
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);
        if (!fs.existsSync(qrCodesDir)) fs.mkdirSync(qrCodesDir);
        
        // Create QR code data
        const qrData = JSON.stringify({ token: token });
        
        // Generate QR code file
        const fullPath = path.join(__dirname, 'public', 'qr', filePath);
        
        await QRCode.toFile(fullPath, qrData, {
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
        
        console.log(`QR code generated: ${filePath}`);
        
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
}

// Close database after a delay
setTimeout(() => {
    console.log('\nTest setup complete!');
    console.log('Test attendees created:');
    console.log('- John Doe (TEST-001)');
    console.log('- Jane Smith (TEST-002)');
    console.log('- Bob Johnson (TEST-003)');
    console.log('\nNow you can:');
    console.log('1. Go to http://localhost:3000/scanner-simple');
    console.log('2. Go to http://localhost:3000/admin to see the QR codes');
    console.log('3. Scan the QR codes with your camera');
    
    db.close();
}, 2000);
