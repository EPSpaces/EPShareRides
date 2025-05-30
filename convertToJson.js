const xlsx = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = xlsx.readFile('carpool_cleaned_with_full_names.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Save as JSON
fs.writeFileSync('data/carpool_cleaned_with_full_names.json', JSON.stringify(data, null, 2));
console.log('Converted Excel to JSON. Output: data/carpool_cleaned_with_full_names.json');
