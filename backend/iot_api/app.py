from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import logging
from io import StringIO
import tempfile
import os

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration for optimal mangrove growth conditions
OPTIMAL_CONDITIONS = {
    'soil_moisture': {'min': 60, 'max': 85, 'unit': '%'},           # 60-85% for mangroves
    'temperature': {'min': 25, 'max': 35, 'unit': '°C'},           # 25-35°C optimal
    'salinity': {'min': 10, 'max': 35, 'unit': 'ppt'},            # 10-35 parts per thousand
    'ph': {'min': 6.5, 'max': 8.5, 'unit': 'pH'},                # Slightly alkaline
    'dissolved_oxygen': {'min': 4, 'max': 8, 'unit': 'mg/L'},     # Good for root health
    'conductivity': {'min': 20, 'max': 50, 'unit': 'mS/cm'}       # Electrical conductivity
}

def score_parameter(value, param_name):
    """
    Score a parameter based on optimal ranges for mangrove growth.
    Returns: 1.0 if optimal, 0.5 if marginal, 0.0 if unsuitable
    """
    if param_name not in OPTIMAL_CONDITIONS:
        return 0.5  # Default score for unknown parameters
    
    optimal = OPTIMAL_CONDITIONS[param_name]
    min_val, max_val = optimal['min'], optimal['max']
    
    # Define marginal ranges (±20% of optimal range)
    range_size = max_val - min_val
    margin = range_size * 0.2
    
    marginal_min = min_val - margin
    marginal_max = max_val + margin
    
    if min_val <= value <= max_val:
        return 1.0  # Optimal
    elif marginal_min <= value <= marginal_max:
        return 0.5  # Marginal
    else:
        return 0.0  # Unsuitable

def process_iot_data(data):
    """
    Process IoT sensor data and calculate scores for each parameter.
    """
    try:
        if isinstance(data, str):
            # Try to parse as JSON first
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                # Try to parse as CSV
                df = pd.read_csv(StringIO(data))
                data = df.to_dict('records')
        
        if isinstance(data, list) and len(data) > 0:
            # Multiple readings - calculate averages
            df = pd.DataFrame(data)
            avg_data = df.mean(numeric_only=True).to_dict()
        elif isinstance(data, dict):
            # Single reading
            avg_data = data
        else:
            raise ValueError("Invalid data format")
        
        # Calculate scores for each parameter
        parameter_scores = {}
        total_score = 0
        count = 0
        
        for param, value in avg_data.items():
            if isinstance(value, (int, float)):
                score = score_parameter(value, param.lower())
                parameter_scores[param] = {
                    'value': round(float(value), 2),
                    'score': score,
                    'status': 'optimal' if score == 1.0 else 'marginal' if score == 0.5 else 'unsuitable',
                    'optimal_range': OPTIMAL_CONDITIONS.get(param.lower(), {})
                }
                total_score += score
                count += 1
        
        # Calculate overall IoT score
        iot_score = total_score / count if count > 0 else 0.0
        
        # Determine overall health status
        if iot_score >= 0.8:
            health_status = "excellent"
        elif iot_score >= 0.6:
            health_status = "good"
        elif iot_score >= 0.4:
            health_status = "marginal"
        else:
            health_status = "poor"
        
        return {
            'IoT_Score': round(iot_score, 3),
            'Health_Status': health_status,
            'Parameter_Scores': parameter_scores,
            'Summary': {
                'total_parameters': count,
                'optimal_parameters': sum(1 for p in parameter_scores.values() if p['score'] == 1.0),
                'marginal_parameters': sum(1 for p in parameter_scores.values() if p['score'] == 0.5),
                'unsuitable_parameters': sum(1 for p in parameter_scores.values() if p['score'] == 0.0)
            },
            'Recommendations': generate_recommendations(parameter_scores)
        }
        
    except Exception as e:
        logger.error(f"Error processing IoT data: {e}")
        return {
            'IoT_Score': 0.0,
            'Health_Status': 'error',
            'Parameter_Scores': {},
            'error': str(e)
        }

def generate_recommendations(parameter_scores):
    """Generate recommendations based on parameter scores."""
    recommendations = []
    
    for param, info in parameter_scores.items():
        if info['score'] < 1.0:
            param_lower = param.lower()
            value = info['value']
            
            if param_lower == 'soil_moisture':
                if value < 60:
                    recommendations.append("Increase irrigation - soil moisture is too low for optimal mangrove growth")
                elif value > 85:
                    recommendations.append("Improve drainage - soil is too waterlogged")
            
            elif param_lower == 'temperature':
                if value < 25:
                    recommendations.append("Consider site protection from cold - temperature is below optimal range")
                elif value > 35:
                    recommendations.append("Provide shade or improve ventilation - temperature is too high")
            
            elif param_lower == 'salinity':
                if value < 10:
                    recommendations.append("Monitor freshwater input - salinity may be too low for mangroves")
                elif value > 35:
                    recommendations.append("Check saltwater intrusion - salinity is too high")
            
            elif param_lower == 'ph':
                if value < 6.5:
                    recommendations.append("Add lime to raise soil pH for better mangrove growth")
                elif value > 8.5:
                    recommendations.append("Add organic matter to lower soil pH")
    
    if not recommendations:
        recommendations.append("All parameters are within optimal ranges - continue current management practices")
    
    return recommendations

def generate_synthetic_data(num_readings=10):
    """Generate synthetic IoT data for testing."""
    data = []
    
    for i in range(num_readings):
        reading = {
            'timestamp': f"2024-01-{i+1:02d} 12:00:00",
            'soil_moisture': np.random.normal(72, 8),      # Around optimal
            'temperature': np.random.normal(30, 3),        # Around optimal  
            'salinity': np.random.normal(22, 5),           # Around optimal
            'ph': np.random.normal(7.5, 0.5),              # Around optimal
            'dissolved_oxygen': np.random.normal(6, 1),     # Around optimal
            'conductivity': np.random.normal(35, 8)         # Around optimal
        }
        
        # Add some variation to make it realistic
        if i % 3 == 0:  # Make some readings suboptimal
            reading['soil_moisture'] *= np.random.uniform(0.7, 1.3)
            reading['temperature'] += np.random.uniform(-5, 8)
        
        # Ensure values are reasonable
        reading['soil_moisture'] = max(0, min(100, reading['soil_moisture']))
        reading['temperature'] = max(0, min(50, reading['temperature']))
        reading['salinity'] = max(0, min(60, reading['salinity']))
        reading['ph'] = max(0, min(14, reading['ph']))
        reading['dissolved_oxygen'] = max(0, min(15, reading['dissolved_oxygen']))
        reading['conductivity'] = max(0, min(100, reading['conductivity']))
        
        data.append(reading)
    
    return data

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "IoT Sensor Data API"
    })

@app.route('/iot', methods=['POST'])
def process_iot_endpoint():
    try:
        # Try to get data from different sources
        data = None
        
        # Check for JSON data
        if request.is_json:
            data = request.get_json()
        
        # Check for form data (JSON string)
        elif 'data' in request.form:
            data = request.form['data']
        
        # Check for CSV file upload
        elif 'file' in request.files:
            file = request.files['file']
            if file.filename.endswith('.csv'):
                data = file.read().decode('utf-8')
            else:
                return jsonify({
                    "error": "Only CSV files are supported for file upload",
                    "IoT_Score": 0.0
                }), 400
        
        # Check for raw text data
        elif request.data:
            data = request.data.decode('utf-8')
        
        if not data:
            return jsonify({
                "error": "No data provided. Send JSON, CSV file, or form data.",
                "IoT_Score": 0.0
            }), 400
        
        # Process the data
        result = process_iot_data(data)
        
        # Add metadata
        result.update({
            "timestamp": str(np.datetime64('now')),
            "data_source": "uploaded_data"
        })
        
        logger.info(f"Processed IoT data: Score = {result['IoT_Score']}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing IoT request: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "IoT_Score": 0.0
        }), 500

@app.route('/demo', methods=['GET'])
def demo_endpoint():
    """Demo endpoint with sample IoT data"""
    
    # Generate synthetic data
    synthetic_data = generate_synthetic_data(5)
    result = process_iot_data(synthetic_data)
    
    # Add demo metadata
    result.update({
        "timestamp": str(np.datetime64('now')),
        "data_source": "synthetic_demo_data",
        "sample_data": synthetic_data[:2]  # Show first 2 readings as example
    })
    
    return jsonify(result)

@app.route('/generate', methods=['GET'])
def generate_synthetic_endpoint():
    """Generate synthetic IoT data for testing"""
    try:
        num_readings = request.args.get('count', 10, type=int)
        num_readings = max(1, min(100, num_readings))  # Limit between 1-100
        
        data = generate_synthetic_data(num_readings)
        
        return jsonify({
            "synthetic_data": data,
            "count": len(data),
            "note": "This is synthetic IoT data generated for testing purposes"
        })
        
    except Exception as e:
        logger.error(f"Error generating synthetic data: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)