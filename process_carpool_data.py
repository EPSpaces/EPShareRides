import pandas as pd
import re
from typing import Dict, List, Tuple, Optional, Any
import sys

def parse_contact_info(text: str) -> Dict[str, str]:
    """Parse contact information from text."""
    result = {
        'phone': '',
        'email': '',
        'contact_type': ''  # e.g., 'H' for home, 'C' for cell, 'W' for work
    }
    
    # Clean the text
    text = text.strip()
    if not text:
        return result
    
    # Check for contact type in parentheses at start (e.g., "(H)", "(C)")
    type_match = re.match(r'^\(([CHW])(?:-[^)]+)?\)\s*(.*)', text)
    if type_match:
        result['contact_type'] = type_match.group(1)
        text = type_match.group(2).strip()
    
    # Extract email
    email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    if email_match:
        result['email'] = email_match.group(1)
        text = text.replace(email_match.group(0), '').strip()
    
    # Extract phone number (standardize format)
    phone_match = re.search(r'\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})', text)
    if phone_match:
        result['phone'] = f"({phone_match.group(1)}) {phone_match.group(2)}-{phone_match.group(3)}"
    
    return result

def parse_student_info(text: str) -> Dict[str, str]:
    """Parse student name and grade from text."""
    if not isinstance(text, str):
        return {'student_name': '', 'grade': ''}
    
    # Try to match patterns like "Name (12)" or "Name (12th Grade)"
    match = re.match(r'^(.+?)\s*\((\d+)(?:st|nd|rd|th)?(?:\s*[gG]rade)?\)$', text.strip())
    if match:
        return {
            'student_name': match.group(1).strip(),
            'grade': match.group(2).strip()
        }
    
    # If no match, return the whole text as name
    return {'student_name': text.strip(), 'grade': ''}

def parse_description(description: str) -> Dict[str, Any]:
    """
    Parse the description field to extract structured information.
    
    Expected format:
    - First line: Address
    - Subsequent lines: Student info (Name (Grade)) and contact information
    """
    if not isinstance(description, str):
        return {
            'address': '',
            'students': [],
            'contacts': []
        }
    
    # Split by <br> tags and clean up the text
    parts = [p.strip() for p in re.split(r'<br\s*/?>', description, flags=re.IGNORECASE) if p.strip()]
    
    if not parts:
        return {'address': '', 'students': [], 'contacts': []}
    
    result = {
        'address': parts[0].strip(),
        'students': [],
        'contacts': []
    }
    
    current_student = None
    
    for part in parts[1:]:
        part = part.strip()
        if not part:
            continue
            
        # Check if this is a student line (contains a grade in parentheses)
        if re.search(r'\(\d+(?:st|nd|rd|th)?(?:\s*[gG]rade)?\)', part):
            if current_student:
                result['students'].append(current_student)
            current_student = parse_student_info(part)
        # Check if this is contact information
        elif re.search(r'(\([CHW](?:-[^)]+)?\)|@|\d{3}[-.]?\d{3}[-.]?\d{4})', part):
            contact = parse_contact_info(part)
            if current_student and 'student_name' in current_student:
                contact['name'] = current_student['student_name']
            result['contacts'].append(contact)
        elif current_student:
            # If we have a current student and this line doesn't match any other pattern,
            # assume it's additional contact info for the current student
            contact = parse_contact_info(part)
            contact['name'] = current_student['student_name']
            result['contacts'].append(contact)
    
    # Add the last student if exists
    if current_student:
        result['students'].append(current_student)
    
    return result

def process_carpool_file(input_file: str, output_file: str) -> None:
    """
    Process the carpool Excel file and save cleaned data to a new file.
    
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
        
        # Create DataFrames for students and contacts
        students_list = []
        contacts_list = []
        
        for idx, row in df.iterrows():
            parent_name = row.get('name', '')
            parsed = parsed_data[idx]
            
            # Add parent info to each student
            for student in parsed['students']:
                students_list.append({
                    'parent_name': parent_name,
                    'student_name': student.get('student_name', ''),
                    'grade': student.get('grade', ''),
                    'address': parsed['address']
                })
            
            # Add contacts
            for contact in parsed['contacts']:
                contacts_list.append({
                    'parent_name': parent_name,
                    'name': contact.get('name', ''),
                    'contact_type': contact.get('contact_type', ''),
                    'phone': contact.get('phone', ''),
                    'email': contact.get('email', '')
                })
        
        # Create DataFrames
        students_df = pd.DataFrame(students_list)
        contacts_df = pd.DataFrame(contacts_list)
        
        # Save to Excel with multiple sheets
        print(f"Saving cleaned data to {output_file}")
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            # Original data without description
            df.drop('description', axis=1, errors='ignore').to_excel(writer, sheet_name='Parents', index=False)
            
            # Students data
            students_df.to_excel(writer, sheet_name='Students', index=False)
            
            # Contacts data
            contacts_df.to_excel(writer, sheet_name='Contacts', index=False)
        
        print("Processing completed successfully!")
        print(f"- {len(students_df)} students processed")
        print(f"- {len(contacts_df)} contacts processed")
        
    except Exception as e:
        print(f"Error processing file: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    input_file = "carpool.xlsx"
    output_file = "carpool_cleaned.xlsx"
    
    # Allow command line arguments for input/output files
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    print(f"Processing {input_file} -> {output_file}")
    process_carpool_file(input_file, output_file)
