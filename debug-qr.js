const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Debugging QR Validation Issues\n');

// Check database connection and data
const db = new sqlite3.Database('./event.db');

console.log('Step 1: Checking database structure...');
db.all('PRAGMA table_info(attendees)', (err, rows) => {
    if (err) {
        console.error('❌ Database error:', err);
        return;
    }
    
    console.log('✅ Database columns:');
    rows.forEach(r => console.log(`   - ${r.name}: ${r.type}`));
    
    console.log('\nStep 2: Getting sample attendee data...');
    db.get('SELECT * FROM attendees LIMIT 1', (err, row) => {
        if (err) {
            console.error('❌ Query error:', err);
            return;
        }
        
        if (!row) {
            console.log('❌ No attendees found in database');
            console.log('💡 Try running: node create-test-data.js');
            return;
        }
        
        console.log('✅ Sample attendee found:');
        console.log(`   Name: ${row.name}`);
        console.log(`   Ticket ID: ${row.ticket_id}`);
        console.log(`   QR Token: ${row.qr_token}`);
        console.log(`   Is Scanned: ${row.is_scanned} (should be 0 for new)`);
        console.log(`   Scan Time: ${row.scan_time || 'null'}`);
        
        console.log('\nStep 3: Simulating QR scan validation...');
        
        // This is the exact format that should come from QR code
        const qrData = JSON.stringify({ token: row.qr_token });
        console.log(`   QR Data Format: ${qrData}`);
        
        try {
            // This simulates the validation logic from server.js
            const parsedData = JSON.parse(qrData);
            const token = parsedData.token;
            
            if (!token) {
                console.log('❌ Token missing from QR data');
                return;
            }
            
            console.log(`   Extracted Token: ${token}`);
            
            // Check if token exists in database
            db.get('SELECT * FROM attendees WHERE qr_token = ?', [token], (err, foundRow) => {
                if (err) {
                    console.log('❌ Database lookup error:', err);
                    return;
                }
                
                if (!foundRow) {
                    console.log('❌ Token not found in database!');
                    console.log('💡 This means QR code has wrong token');
                    return;
                }
                
                console.log('✅ Token found in database');
                
                if (foundRow.is_scanned) {
                    console.log('❌ QR code already scanned');
                    console.log(`   Scan time: ${foundRow.scan_time}`);
                    return;
                }
                
                console.log('✅ QR code is valid and unused');
                console.log('\nStep 4: Testing scan update...');
                
                // Test the update logic
                db.run('UPDATE attendees SET is_scanned = 1, scan_time = CURRENT_TIMESTAMP WHERE qr_token = ?', 
                [token], function(err) {
                    if (err) {
                        console.log('❌ Update failed:', err);
                        return;
                    }
                    
                    console.log('✅ Scan status updated successfully');
                    console.log(`   Rows affected: ${this.changes}`);
                    
                    // Verify the update
                    db.get('SELECT is_scanned, scan_time FROM attendees WHERE qr_token = ?', [token], (err, updatedRow) => {
                        if (err) {
                            console.log('❌ Verification error:', err);
                            return;
                        }
                        
                        console.log('✅ Verification complete:');
                        console.log(`   Is Scanned: ${updatedRow.is_scanned}`);
                        console.log(`   Scan Time: ${updatedRow.scan_time}`);
                        
                        console.log('\n🎉 QR VALIDATION LOGIC IS WORKING CORRECTLY!');
                        console.log('\n💡 If scans are still failing, the issue is likely:');
                        console.log('   1. QR code format doesn\'t match expected JSON');
                        console.log('   2. Camera scanning is not reading QR correctly');
                        console.log('   3. Network issues between scanner and server');
                        
                        db.close();
                    });
                });
            });
            
        } catch (parseError) {
            console.log('❌ JSON parsing failed:', parseError);
            console.log('💡 QR data is not valid JSON format');
        }
    });
});
