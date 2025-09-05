const xlsx = require('xlsx');

// Create a test Excel file with the exact format from your image
const testData = [
    { "Name": "Renad Al renadahr", "Ticket_ID": "TCK-001", "Email": "renad@university.eg" },
    { "Name": "Ahmed nahmedah", "Ticket_ID": "TCK-002", "Email": "ahmed@university.eg" },
    { "Name": "Malak Samalalsar", "Ticket_ID": "TCK-003", "Email": "malak@university.eg" },
    { "Name": "Ola Yousefyoues", "Ticket_ID": "TCK-004", "Email": "ola@university.eg" },
    { "Name": "Noor gacnoorgad", "Ticket_ID": "TCK-005", "Email": "noor@university.eg" }
];

// Create workbook and worksheet
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(testData);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(wb, ws, "Attendees");

// Write the file
xlsx.writeFile(wb, 'test-attendees.xlsx');

console.log('Test Excel file created: test-attendees.xlsx');
console.log('Test data:', testData);
