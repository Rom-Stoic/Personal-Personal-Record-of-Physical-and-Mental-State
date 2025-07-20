from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import os
from datetime import datetime
import numpy as np

app = Flask(__name__, static_folder='.', static_url_path='')

# Configuration
EXCEL_FILE = 'ROM数据模板.xlsx'
SHEET_NAME = 'Sheet1'
DATE_COLUMN = '日期'

@app.route('/')
def index():
    """Serve the main HTML file."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files like CSS and JS."""
    return send_from_directory('.', path)

# --- NEW ENDPOINT TO FETCH DATA ---
@app.route('/get_data', methods=['GET'])
def get_data():
    """Fetch existing data for a given date from the Excel file."""
    date_query = request.args.get('date')
    if not date_query:
        return jsonify({"error": "Date parameter is required"}), 400

    if not os.path.exists(EXCEL_FILE):
        # If the file doesn't exist, there's no data. This is not an error.
        return jsonify({})

    try:
        # Format date from YYYY-MM-DD to YYYY/MM/DD for comparison
        date_obj = datetime.strptime(date_query, '%Y-%m-%d')
        date_to_find = date_obj.strftime('%Y/%m/%d')

        df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME, header=1)
        
        # Ensure the date column is treated as a string to avoid formatting issues with different locales
        df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors='coerce').dt.strftime('%Y/%m/%d')

        row = df[df[DATE_COLUMN] == date_to_find]

        if not row.empty:
            # Convert the row to a dictionary
            data = row.iloc[0].to_dict()
            # Replace numpy.nan with None for proper JSON serialization
            cleaned_data = {k: (None if pd.isna(v) else v) for k, v in data.items()}
            return jsonify(cleaned_data)
        else:
            return jsonify({}) # Return empty object if no data found for the date

    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/save_data', methods=['POST'])
def save_data():
    """Receive data from the frontend and save it to the Excel file."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        if DATE_COLUMN not in data or not data[DATE_COLUMN]:
            return jsonify({"error": "Date is a required field"}), 400
        
        # Format date to match Excel's default date format
        try:
            date_obj = datetime.strptime(data[DATE_COLUMN], '%Y-%m-%d')
            data[DATE_COLUMN] = date_obj.strftime('%Y/%m/%d')
        except ValueError:
            pass

        if not os.path.exists(EXCEL_FILE):
            return jsonify({"error": f"Excel file '{EXCEL_FILE}' not found."}), 500
            
        try:
            df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME, header=1)
        except Exception as e:
            return jsonify({"error": f"Error reading Excel file: {str(e)}"}), 500

        df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors='coerce').dt.strftime('%Y/%m/%d')

        date_to_find = data[DATE_COLUMN]
        row_index = df.index[df[DATE_COLUMN] == date_to_find].tolist()

        if row_index:
            # --- UPDATE EXISTING ROW ---
            idx = row_index[0]
            for key, value in data.items():
                if key in df.columns:
                    # When updating, if an empty string is sent for a numeric field, treat it as NaN (Not a Number)
                    if pd.api.types.is_numeric_dtype(df[key]) and value == '':
                        value = np.nan
                    # Use .loc for safe assignment
                    df.loc[idx, key] = value
                else:
                    print(f"Warning: Column '{key}' not found in Excel file. Skipping.")
        else:
            # --- ADD NEW ROW ---
            new_row = {col: np.nan for col in df.columns}
            for key, value in data.items():
                 if key in new_row:
                    if pd.api.types.is_numeric_dtype(df[key]) and value == '':
                        value = np.nan
                    new_row[key] = value
                 else:
                    print(f"Warning: Column '{key}' not found in Excel file. Skipping.")
            
            new_row_df = pd.DataFrame([new_row])
            df = pd.concat([df, new_row_df], ignore_index=True)

        # --- SAVE BACK TO EXCEL ---
        first_header_df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME, header=None, nrows=1)
        
        with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl', mode='w') as writer:
            first_header_df.to_excel(writer, sheet_name=SHEET_NAME, index=False, header=False)
            df.to_excel(writer, sheet_name=SHEET_NAME, index=False, startrow=1)

        return jsonify({"message": "Data saved successfully"}), 200

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"Data will be saved to '{os.path.abspath(EXCEL_FILE)}'")
    print("Open http://127.0.0.1:5000 in your browser.")
    app.run(debug=True, port=5000)
