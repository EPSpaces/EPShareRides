import pandas as pd
import re

def extract_last_name(parent_name: str) -> str:
    """Extract the last word from the parent's name."""
    if not isinstance(parent_name, str) or not parent_name.strip():
        return ""
    # Split by spaces and get the last non-empty word
    parts = [p.strip() for p in parent_name.split() if p.strip()]
    return parts[-1] if parts else ""

def update_student_names(input_file: str, output_file: str) -> None:
    """
    Update student names by appending the parent's last name.
    
    Args:
        input_file: Path to the input Excel file
        output_file: Path to save the updated Excel file
    """
    try:
        print(f"Reading {input_file}...")
        df = pd.read_excel(input_file, engine='openpyxl')
        
        # Extract last names from parent_name
        df['parent_last_name'] = df['parent_name'].apply(extract_last_name)
        
        # Update student_name to include the last name if it's not already there
        def update_name(row):
            student_name = str(row['student_name']).strip()
            last_name = str(row['parent_last_name']).strip()
            
            # Skip if no student name or no last name to add
            if not student_name or not last_name:
                return student_name
                
            # Check if the last name is already in the student's name
            if last_name.lower() not in student_name.lower():
                return f"{student_name} {last_name}"
            return student_name
        
        # Apply the update
        df['student_name'] = df.apply(update_name, axis=1)
        
        # Drop the temporary column
        df = df.drop('parent_last_name', axis=1)
        
        # Save the updated data
        print(f"Saving updated data to {output_file}")
        df.to_excel(output_file, index=False, engine='openpyxl')
        
        print("Update completed successfully!")
        print(f"Updated {len(df)} rows")
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise

if __name__ == "__main__":
    input_file = "carpool_cleaned.xlsx"
    output_file = "carpool_cleaned_with_full_names.xlsx"
    
    update_student_names(input_file, output_file)
