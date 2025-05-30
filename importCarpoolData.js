const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Student = require('./models/Student');
const { geocodeAddress } = require('./utils/geocoding');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MongoDB connection string not found in environment variables');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Please make sure MongoDB is running and the connection string is correct.');
    console.error('If using MongoDB Atlas, ensure your IP is whitelisted.');
    process.exit(1);
  }
};

// Main function to run the import
const main = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Start the import
    await importData();
    
    // Close the connection when done
    await mongoose.connection.close();
    console.log('Import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
};

// Run the main function
main();

async function importData() {
  console.log('Starting data import...');
  try {
    // Read the Excel file
    const workbook = xlsx.readFile('carpool_cleaned_with_full_names.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    console.log(`Found ${data.length} records to import`);
    
    // Clear existing data
    await Student.deleteMany({});
    console.log('Cleared existing student data');
    
    // Process each record
    let importedCount = 0;
    const errors = [];
    
    for (const [index, row] of data.entries()) {
      try {
        // Skip if missing required fields
        if (!row.student_name || !row.address) {
          console.warn(`Skipping row ${index + 2}: Missing required fields`);
          continue;
        }
        
        // Create student document
        const student = new Student({
          name: row.student_name,
          parentName: row.parent_name || '',
          grade: row.grade || '',
          address: row.address,
          contactInfo: row.contact_info || '',
          location: {
            type: 'Point',
            coordinates: [
              parseFloat(row.longitude || 0),
              parseFloat(row.latitude || 0)
            ]
          }
        });
        
        await student.save();
        importedCount++;
        
        if (importedCount % 10 === 0) {
          console.log(`Imported ${importedCount} records...`);
        }
        
      } catch (error) {
        errors.push({
          row: index + 2, // +2 because Excel is 1-based and we have a header
          error: error.message
        });
        console.error(`Error importing row ${index + 2}:`, error.message);
      }
    }
    
    console.log(`\nImport completed!`);
    console.log(`- Successfully imported: ${importedCount} records`);
    console.log(`- Failed to import: ${errors.length} records`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`Row ${err.row}: ${err.error}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

// Run the import
importData();
