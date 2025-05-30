const sqlite3 = require('better-sqlite3');
const xlsx = require('xlsx');
const path = require('path');

// Initialize SQLite database
const db = new sqlite3('carpool.db');

// Create students table
function createTables() {
  db.exec(`
    DROP TABLE IF EXISTS students;
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_name TEXT,
      grade TEXT,
      address TEXT NOT NULL,
      contact_info TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_students_location ON students (latitude, longitude);
  `);
  console.log('Created students table');
}

// Import data from Excel to SQLite
async function importData() {
  try {
    console.log('Starting data import...');
    
    // Read the Excel file
    const workbook = xlsx.readFile('carpool_cleaned_with_full_names.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    console.log(`Found ${data.length} records to import`);
    
    // Prepare the insert statement
    const stmt = db.prepare(`
      INSERT INTO students (name, parent_name, grade, address, contact_info, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Start a transaction for better performance
    const insertMany = db.transaction((students) => {
      for (const student of students) {
        try {
          stmt.run(
            student.student_name || '',
            student.parent_name || '',
            student.grade || '',
            student.address || '',
            student.contact_info || '',
            parseFloat(student.latitude) || 0,
            parseFloat(student.longitude) || 0
          );
        } catch (err) {
          console.error('Error inserting student:', err);
        }
      }
    });
    
    // Insert all students
    insertMany(data);
    
    console.log(`Successfully imported ${data.length} students`);
    
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Create tables
    createTables();
    
    // Import data
    await importData();
    
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the main function
main();
