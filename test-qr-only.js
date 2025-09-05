const QRCode = require('qrcode');

async function testQRGeneration() {
    console.log('🔍 Testing QR Code Generation...\n');
    
    try {
        // Test 1: Basic QR Generation
        console.log('1. Testing basic QR generation...');
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
        console.log('📏 QR Code length:', qrCodeDataUrl.length, 'characters');
        console.log('🎯 QR Code starts with:', qrCodeDataUrl.substring(0, 50) + '...');
        console.log('📋 Token encoded:', testToken);
        
        // Test 2: JSON QR Generation (like in your system)
        console.log('\n2. Testing JSON QR generation...');
        const qrData = JSON.stringify({
            token: testToken,
            name: 'Test User',
            ticketId: 'T001',
            email: 'test@example.com',
            event: 'QR MUN Event'
        });
        
        const jsonQrCode = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        console.log('✅ JSON QR code generated successfully!');
        console.log('📏 JSON QR Code length:', jsonQrCode.length, 'characters');
        console.log('📋 JSON data encoded:', qrData.substring(0, 100) + '...');
        
        console.log('\n🎉 QR Code generation is working perfectly!');
        console.log('\n📝 Your system should now work:');
        console.log('1. Visit http://localhost:3000/admin');
        console.log('2. Password: genoo');
        console.log('3. Upload Excel file with "name" and "id" columns');
        console.log('4. QR codes will be generated and stored as base64 data');
        
    } catch (error) {
        console.error('❌ QR Generation Error:', error.message);
    }
}

testQRGeneration();
