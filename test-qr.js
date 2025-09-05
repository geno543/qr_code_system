const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./event.db');

// Get a sample QR token to test
db.get('SELECT * FROM attendees LIMIT 1', (err, row) => {
    if (err) {
        console.error('Database error:', err);
        return;
    }
    
    if (row) {
        console.log('Sample attendee:');
        console.log('Name:', row.name);
        console.log('Ticket ID:', row.ticket_id);
        console.log('QR Token:', row.qr_token);
        console.log('QR Code Path:', row.qr_code_path);
        console.log('Is Scanned:', row.is_scanned);
        
        // Show what the QR code should contain
        const qrData = JSON.stringify({ token: row.qr_token });
        console.log('\nQR Code should contain:', qrData);
        
        console.log('\nTo test scanner:');
        console.log('1. Go to http://localhost:3000/scanner');
        console.log('2. Allow camera permissions');
        console.log('3. Point camera at QR code in public/qr/' + row.qr_code_path);
    } else {
        console.log('No attendees found in database');
    }
    
    db.close();
});
