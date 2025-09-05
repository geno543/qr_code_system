const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const fs = require('fs');

console.log('🔍 Checking QR Code Content\n');

const db = new sqlite3.Database('./event.db');

// Get an attendee and check their QR code
db.get('SELECT * FROM attendees LIMIT 1', (err, row) => {
    if (err) {
        console.error('Database error:', err);
        return;
    }
    
    if (!row) {
        console.log('No attendees found');
        return;
    }
    
    console.log(`Checking QR for: ${row.name}`);
    console.log(`QR Token in DB: ${row.qr_token}`);
    console.log(`QR Code Path: ${row.qr_code_path}`);
    
    // The QR code should contain this format (based on server.js generation logic)
    const expectedQRData = JSON.stringify({
        token: row.qr_token,
        name: row.name,
        ticketId: row.ticket_id,
        email: row.email,
        event: 'QR MUN Event'
    });
    
    console.log('\nExpected QR Content:');
    console.log(expectedQRData);
    
    // Test if this format works with validation
    console.log('\nTesting validation with expected format...');
    
    try {
        const parsedData = JSON.parse(expectedQRData);
        const token = parsedData.token;
        
        if (!token) {
            console.log('❌ No token found in parsed data');
            return;
        }
        
        console.log(`✅ Token extracted: ${token}`);
        
        // Check if this token exists in database
        db.get('SELECT name FROM attendees WHERE qr_token = ?', [token], (err, foundRow) => {
            if (err) {
                console.log('❌ Database error:', err);
                return;
            }
            
            if (foundRow) {
                console.log(`✅ Token matches database entry for: ${foundRow.name}`);
                console.log('\n🎉 QR FORMAT IS CORRECT!');
                console.log('\n💡 The issue might be:');
                console.log('1. Camera not reading QR codes properly');
                console.log('2. jsQR library not decoding correctly');
                console.log('3. Network connectivity issues');
                console.log('4. QR codes were corrupted during generation');
                
                // Let's also test if we can read the actual QR image file
                const qrPath = `public/qr/${row.qr_code_path}`;
                if (fs.existsSync(qrPath)) {
                    console.log(`\n✅ QR code file exists at: ${qrPath}`);
                } else {
                    console.log(`\n❌ QR code file missing at: ${qrPath}`);
                }
                
            } else {
                console.log('❌ Token not found in database - this is strange!');
            }
            
            db.close();
        });
        
    } catch (parseError) {
        console.log('❌ JSON parsing failed:', parseError);
    }
});
