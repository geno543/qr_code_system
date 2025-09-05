const db = require('./supabase-db');
const QRCode = require('qrcode');

async function testSystem() {
    console.log('🔍 Testing QR Event System...\n');
    
    try {
        // Test 1: Database Connection
        console.log('1. Testing database connection...');
        const attendees = await db.getAllAttendees();
        console.log(`✅ Database connected! Found ${attendees.length} attendees\n`);
        
        // Test 2: QR Code Generation
        console.log('2. Testing QR code generation...');
        const testToken = 'test-' + Date.now();
        const qrCodeDataUrl = await QRCode.toDataURL(testToken, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        console.log('✅ QR code generated successfully!');
        console.log('QR Code length:', qrCodeDataUrl.length, 'characters');
        console.log('QR Code starts with:', qrCodeDataUrl.substring(0, 50) + '...\n');
        
        // Test 3: Sample attendee creation
        console.log('3. Testing attendee creation...');
        const sampleAttendee = {
            name: 'Test User',
            attendee_id: 'TEST-001',
            email: 'test@example.com',
            token: testToken,
            qr_code: qrCodeDataUrl,
            scanned: false
        };
        
        const newAttendee = await db.insertAttendee(sampleAttendee);
        console.log('✅ Test attendee created with ID:', newAttendee.id);
        
        // Test 4: Retrieve and verify
        const retrieved = await db.getAttendeeByToken(testToken);
        console.log('✅ Test attendee retrieved:', retrieved.name);
        
        // Clean up
        await db.deleteAttendee(newAttendee.id);
        console.log('✅ Test attendee cleaned up\n');
        
        console.log('🎉 All tests passed! Your QR system is working correctly.');
        console.log('\n📝 To use the system:');
        console.log('1. Visit http://localhost:3000/admin');
        console.log('2. Enter password: genoo');
        console.log('3. Upload your Excel file with "name" and "id" columns');
        console.log('4. Use http://localhost:3000/scanner to scan QR codes');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        
        if (error.message.includes('relation "attendees" does not exist')) {
            console.log('\n🔧 SOLUTION: You need to set up the database first!');
            console.log('1. Go to https://supabase.com and login');
            console.log('2. Navigate to your project SQL Editor');
            console.log('3. Copy and run the entire contents of setup-supabase.sql');
            console.log('4. Run this test again after setting up the database');
        } else {
            console.log('\nFull error details:', error);
        }
    }
}

testSystem();
