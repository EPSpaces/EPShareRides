import pandas as pd
import re
from typing import List, Dict, Tuple, Optional
import sys

def parse_description(description: str) -> Dict[str, any]:
    """
    Parse the description field into its components:
    1. Address (before first <br>)
    2. Student names and grades (between <br> tags)
    3. Contact information (after last <br>)
    
    Args:
        description: The description string to parse
        
    Returns:
        Dictionary with parsed components
    """
    if not isinstance(description, str):
        return {
            'address': '',
            'students': [],
            'contact_info': ''
        }
    
    # Split by <br> tags and remove empty strings
    parts = [p.strip() for p in re.split(r'<br\s*/?>', description, flags=re.IGNORECASE) if p.strip()]
    
    if not parts:
        return {'address': '', 'students': [], 'contact_info': ''}
    
    # First part is always the address
    address = parts[0].strip()
    
    # Last part is contact info if there are at least 2 parts
    contact_info = parts[-1] if len(parts) > 1 else ''
    
    # Everything between address and contact info is student info
    student_parts = parts[1:-1] if len(parts) > 2 else parts[1:]
    
    # Parse student info (name and grade)
    students = []
    for student_str in student_parts:
        # Extract grade if present (e.g., "Ella (12)")
        grade_match = re.search(r'\((\d+)\)', student_str)
        grade = grade_match.group(1) if grade_match else ''
        
        # Extract name (everything before the grade in parentheses)
        name = re.sub(r'\s*\(\d+\)', '', student_str).strip()
        
        students.append({
            'name': name,
            'grade': grade
        })
    
    # Clean up contact info (remove extra spaces, normalize formatting)
    if contact_info:
        # Add spaces after parentheses for better readability
        contact_info = re.sub(r'(?<=\))(?=\S)', ' ', contact_info)
        # Add spaces before parentheses that follow letters/numbers
        contact_info = re.sub(r'(?<=\S)(?=\()', ' ', contact_info)
        # Clean up multiple spaces
        contact_info = ' '.join(contact_info.split())
    
    return {
        'address': address,
        'students': students,
        'contact_info': contact_info
    }

def process_carpool_file(input_file: str, output_file: str) -> None:
    """
    Process the carpool Excel file and save the cleaned data.
    
    Args:
        input_file: Path to the input Excel file
        output_file: Path to save the cleaned Excel file
    """
    try:
        print(f"Reading {input_file}...")
        df = pd.read_excel(input_file, engine='openpyxl')
        
        if 'description' not in df.columns:
            raise ValueError("Input file must contain a 'description' column")
        
        print(f"Found {len(df)} rows to process")
        
        # Parse the description column
        parsed_data = df['description'].apply(parse_description)
        
        # Create a list to hold all rows for the output
        output_rows = []
        
        # Process each row in the original dataframe
        for idx, row in df.iterrows():
            parent_name = row.get('name', '')
            parsed = parsed_data[idx]
            
            # If there are no students, still include the row with empty student info
            if not parsed['students']:
                output_rows.append({
                    'parent_name': parent_name,
                    'longitude': row.get('longitude', ''),
                    'latitude': row.get('latitude', ''),
                    'altitude': row.get('altitude', ''),
                    'address': parsed['address'],
                    'student_name': '',
                    'grade': '',
                    'contact_info': parsed['contact_info']
                })
            else:
                # Create one row per student
                for student in parsed['students']:
                    output_rows.append({
                        'parent_name': parent_name,
                        'longitude': row.get('longitude', ''),
                        'latitude': row.get('latitude', ''),
                        'altitude': row.get('altitude', ''),
                        'address': parsed['address'],
                        'student_name': student['name'],
                        'grade': student['grade'],
                        'contact_info': parsed['contact_info']
                    })
        
        # Create a new DataFrame with the processed data
        result_df = pd.DataFrame(output_rows)
        
        # Reorder columns
        column_order = [
            'parent_name',
            'student_name',
            'grade',
            'address',
            'longitude',
            'latitude',
            'altitude',
            'contact_info'
        ]
        result_df = result_df[column_order]
        
        # Save to Excel
        print(f"Saving cleaned data to {output_file}")
        result_df.to_excel(output_file, index=False, engine='openpyxl')
        
        print("Processing completed successfully!")
        print(f"- {len(result_df)} total rows created")
        print(f"- {len(result_df[result_df['student_name'] != ''])} rows with student information")
        
    except Exception as e:
        print(f"Error processing file: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    input_file = "carpool.xlsx"
    output_file = "carpool_cleaned_simple.xlsx"
    
    # Allow command line arguments for input/output files
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    print(f"Processing {input_file} -> {output_file}")
    process_carpool_file(input_file, output_file)
