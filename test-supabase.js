const db = require('./supabase-db');

async function testSupabase() {
    try {
        console.log('Testing Supabase connection...');
        
        // Get attendee count
        const count = await db.getAttendeeCount();
        console.log('Attendee count:', count);
        
        // Get all attendees
        const attendees = await db.getAllAttendees();
        console.log('Found', attendees.length, 'attendees');
        
        if (attendees.length > 0) {
            const first = attendees[0];
            console.log('\nFirst attendee:');
            console.log('Name:', first.name);
            console.log('QR code available:', !!first.qr_code);
            if (first.qr_code) {
                console.log('QR code type:', typeof first.qr_code);
                console.log('QR code starts with:', first.qr_code.substring(0, 50) + '...');
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSupabase();
