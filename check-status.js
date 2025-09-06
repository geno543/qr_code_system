const fetch = require('node-fetch');

async function checkDeploymentStatus() {
    console.log('🔍 Checking QR Event System Status...\n');
    
    const checks = [
        {
            name: 'Local Development',
            url: 'http://localhost:3001/health',
            critical: false
        },
        {
            name: 'Production Deployment',
            url: 'https://qr-code-system-jet.vercel.app/health',
            critical: true
        },
        {
            name: 'Environment Config',
            url: 'https://qr-code-system-jet.vercel.app/debug/env',
            critical: true
        }
    ];
    
    for (const check of checks) {
        try {
            console.log(`📡 Checking ${check.name}...`);
            const response = await fetch(check.url, { timeout: 10000 });
            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ ${check.name}: Working`);
                if (data.status === 'healthy') {
                    console.log(`   Database: ${data.database}`);
                    if (data.attendees !== undefined) {
                        console.log(`   Attendees: ${data.attendees} (${data.scanned || 0} scanned)`);
                    }
                }
                if (data.hasSupabaseUrl !== undefined) {
                    console.log(`   Environment: ${data.hasSupabaseUrl && data.hasSupabaseKey ? 'Configured' : 'Missing variables'}`);
                }
            } else {
                console.log(`⚠️  ${check.name}: HTTP ${response.status}`);
                console.log(`   Error: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            const status = check.critical ? '❌' : '⚠️ ';
            console.log(`${status} ${check.name}: ${error.code || error.message}`);
        }
        console.log('');
    }
    
    console.log('📋 Quick Access Links:');
    console.log('   Local: http://localhost:3001');
    console.log('   Admin: http://localhost:3001/admin');
    console.log('   Scanner: http://localhost:3001/scanner');
    console.log('   Production: https://qr-code-system-jet.vercel.app');
    console.log('\n✨ Status check complete!');
}

// Run the check
checkDeploymentStatus().catch(console.error);
