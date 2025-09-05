const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

console.log('🔧 Regenerating QR Codes for All Attendees\n');

// Ensure directories exist
const qrDir = 'public/qr/qr-codes';
if (!fs.existsSync('public')) fs.mkdirSync('public');
if (!fs.existsSync('public/qr')) fs.mkdirSync('public/qr');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

const db = new sqlite3.Database('./event.db');

// Get all attendees
db.all('SELECT * FROM attendees', (err, attendees) => {
    if (err) {
        console.error('Database error:', err);
        return;
    }
    
    if (attendees.length === 0) {
        console.log('No attendees found in database');
        console.log('Run: node create-test-data.js first');
        return;
    }
    
    console.log(`Found ${attendees.length} attendees. Generating QR codes...\n`);
    
    let completed = 0;
    const total = attendees.length;
    
    attendees.forEach((attendee, index) => {
        // Create QR data (same format as in server.js)
        const qrData = JSON.stringify({
            token: attendee.qr_token,
            name: attendee.name,
            ticketId: attendee.ticket_id,
            email: attendee.email,
            event: 'QR MUN Event'
        });
        
        // Generate filename
        const filename = `${attendee.qr_token}.png`;
        const filepath = path.join(qrDir, filename);
        
        // Generate QR code
        QRCode.toFile(filepath, qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (err) => {
            if (err) {
                console.error(`❌ Failed to generate QR for ${attendee.name}:`, err);
            } else {
                console.log(`✅ Generated QR for: ${attendee.name}`);
                
                // Update database with correct path
                const qrPath = `qr-codes/${filename}`;
                db.run('UPDATE attendees SET qr_code_path = ? WHERE id = ?', 
                    [qrPath, attendee.id], (updateErr) => {
                    if (updateErr) {
                        console.error(`❌ Failed to update path for ${attendee.name}:`, updateErr);
                    }
                });
            }
            
            completed++;
            if (completed === total) {
                console.log(`\n🎉 Completed! Generated ${completed} QR codes`);
                console.log('\nNow you can:');
                console.log('1. Go to http://localhost:3000/admin to see QR codes');
                console.log('2. Test scanning at http://localhost:3000/scanner');
                console.log('3. Print QR codes and test with camera');
                
                db.close();
            }
        });
    });
});
