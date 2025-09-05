const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

// Get a test token from database
const db = new sqlite3.Database('./event.db');

db.get('SELECT name, qr_token FROM attendees LIMIT 1', (err, row) => {
    if (err) {
        console.error('Database error:', err);
        return;
    }

    if (!row) {
        console.log('No attendees found in database');
        return;
    }

    console.log(`Testing QR validation for: ${row.name}`);
    console.log(`Token: ${row.qr_token}`);

    // Format the QR data as JSON (this is what the QR code should contain)
    const qrData = JSON.stringify({ token: row.qr_token });
    console.log(`QR Data: ${qrData}`);

    // Test the validation endpoint
    fetch('http://localhost:3000/validate-qr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: qrData })
    })
    .then(response => response.json())
    .then(result => {
        console.log('\n--- Validation Result ---');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('\n✅ VALIDATION SUCCESS!');
        } else {
            console.log('\n❌ VALIDATION FAILED!');
            console.log('Reason:', result.message);
        }
        
        db.close();
    })
    .catch(error => {
        console.error('Network error:', error);
        db.close();
    });
});
