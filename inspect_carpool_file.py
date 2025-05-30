import pandas as pd

def inspect_file(file_path):
    # Read the Excel file
    df = pd.read_excel(file_path, engine='openpyxl')
    
    # Display column names and data types
    print("\n=== Column Names and Data Types ===")
    print(df.dtypes)
    
    # Display first few rows of data
    print("\n=== First 5 Rows ===")
    print(df.head().to_string())
    
    # Display unique values in the description column
    if 'description' in df.columns:
        print("\n=== Sample Descriptions ===")
        for i, desc in enumerate(df['description'].head(10), 1):
            print(f"\n--- Description {i} ---")
            print(desc)
    
    # Display any other relevant columns
    for col in ['name', 'grade', 'email', 'phone']:
        if col in df.columns:
            print(f"\n=== Unique values in '{col}' (first 20) ===")
            print(df[col].dropna().unique()[:20])

if __name__ == "__main__":
    input_file = "carpool.xlsx"
    print(f"Inspecting {input_file}...")
    inspect_file(input_file)
