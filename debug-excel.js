const xlsx = require('xlsx');
const fs = require('fs');

console.log('=== Excel Debug Tool ===');

// Function to analyze any Excel file
function debugExcelFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    console.log(`\nAnalyzing: ${filePath}`);
    
    try {
        const workbook = xlsx.readFile(filePath);
        console.log('Sheet names:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get the data in different ways
        const data = xlsx.utils.sheet_to_json(worksheet);
        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
        
        console.log('Headers found:', headers);
        console.log('Total rows:', data.length);
        console.log('First row sample:', data[0]);
        
        if (data.length > 1) {
            console.log('Second row sample:', data[1]);
        }
        
        // Test column name variations
        if (data.length > 0) {
            const row = data[0];
            console.log('\n=== Column Detection Test ===');
            console.log('Name variations:');
            console.log('  row.Name:', row.Name);
            console.log('  row.name:', row.name);
            console.log('  row.NAME:', row.NAME);
            console.log('  row["Name"]:', row["Name"]);
            
            console.log('Ticket_ID variations:');
            console.log('  row.Ticket_ID:', row.Ticket_ID);
            console.log('  row.ticket_id:', row.ticket_id);
            console.log('  row.TICKET_ID:', row.TICKET_ID);
            console.log('  row["Ticket_ID"]:', row["Ticket_ID"]);
            console.log('  row["Ticket ID"]:', row["Ticket ID"]);
            
            console.log('Email variations:');
            console.log('  row.Email:', row.Email);
            console.log('  row.email:', row.email);
            console.log('  row.EMAIL:', row.EMAIL);
            console.log('  row["Email"]:', row["Email"]);
        }
        
    } catch (error) {
        console.error('Error reading Excel file:', error.message);
    }
}

// Test the created file
debugExcelFile('test-attendees.xlsx');

// Also check if there are any other Excel files
console.log('\n=== Available files ===');
const files = fs.readdirSync('.');
const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
console.log('Excel files found:', excelFiles);

// If you have your original file, put it in the directory and uncomment this:
// debugExcelFile('your-original-file.xlsx');
