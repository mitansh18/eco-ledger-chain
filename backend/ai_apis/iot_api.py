"""
EcoLedger - IoT Sensor Data API
Processes IoT sensor data (soil moisture, temperature, salinity) for mangrove health assessment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import io
import random
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

class IoTSensorService:
    def __init__(self):
        # Optimal ranges for mangrove growth
        self.optimal_ranges = {
            'soil_moisture': {'min': 60, 'max': 90, 'unit': '%'},  # Mangroves need high soil moisture
            'temperature': {'min': 24, 'max': 32, 'unit': '°C'},   # Tropical temperature range
            'salinity': {'min': 15, 'max': 35, 'unit': 'ppt'},     # Brackish to marine salinity
            'ph': {'min': 6.5, 'max': 8.5, 'unit': 'pH'},         # Slightly alkaline
            'dissolved_oxygen': {'min': 4, 'max': 8, 'unit': 'mg/L'}  # Adequate oxygen levels
        }
        
        # Marginal ranges (still acceptable but not ideal)
        self.marginal_ranges = {
            'soil_moisture': {'min': 45, 'max': 95},
            'temperature': {'min': 20, 'max': 38},
            'salinity': {'min': 10, 'max': 45},
            'ph': {'min': 6.0, 'max': 9.0},
            'dissolved_oxygen': {'min': 3, 'max': 10}
        }
    
    def process_sensor_data(self, data, data_format='json'):
        """Process IoT sensor data and calculate health scores"""
        try:
            if data_format == 'csv':
                df = self._parse_csv_data(data)
            else:
                df = self._parse_json_data(data)
            
            # Calculate scores for each parameter
            parameter_scores = self._calculate_parameter_scores(df)
            
            # Calculate overall IoT score
            iot_score = self._calculate_iot_score(parameter_scores)
            
            # Generate insights and recommendations
            insights = self._generate_insights(df, parameter_scores)
            
            # Calculate temporal trends if timestamps available
            trends = self._analyze_trends(df)
            
            return {
                "IoT_Score": round(iot_score, 3),
                "Parameter_Scores": parameter_scores,
                "Data_Summary": self._summarize_data(df),
                "Insights": insights,
                "Trends": trends,
                "Health_Status": self._classify_health_status(iot_score),
                "Recommendations": self._generate_recommendations(parameter_scores)
            }
            
        except Exception as e:
            raise Exception(f"Error processing IoT data: {str(e)}")
    
    def _parse_csv_data(self, csv_data):
        """Parse CSV data from uploaded file"""
        try:
            df = pd.read_csv(io.StringIO(csv_data))
            
            # Standardize column names (handle different naming conventions)
            column_mapping = {
                'moisture': 'soil_moisture',
                'soil_moisture_percent': 'soil_moisture',
                'temp': 'temperature',
                'temperature_celsius': 'temperature',
                'sal': 'salinity',
                'salinity_ppt': 'salinity',
                'ph_level': 'ph',
                'do': 'dissolved_oxygen',
                'oxygen': 'dissolved_oxygen'
            }
            
            df.columns = df.columns.str.lower().str.replace(' ', '_')
            df.rename(columns=column_mapping, inplace=True)
            
            # Convert timestamp column if present
            timestamp_cols = ['timestamp', 'time', 'date', 'datetime']
            for col in timestamp_cols:
                if col in df.columns:
                    df['timestamp'] = pd.to_datetime(df[col])
                    break
            
            return df
            
        except Exception as e:
            raise Exception(f"Error parsing CSV data: {str(e)}")
    
    def _parse_json_data(self, json_data):
        """Parse JSON data"""
        try:
            if isinstance(json_data, str):
                data = json.loads(json_data)
            else:
                data = json_data
            
            # Handle different JSON structures
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                if 'readings' in data:
                    df = pd.DataFrame(data['readings'])
                elif 'data' in data:
                    df = pd.DataFrame(data['data'])
                else:
                    # Assume it's a single reading
                    df = pd.DataFrame([data])
            else:
                raise ValueError("Invalid JSON structure")
            
            return df
            
        except Exception as e:
            raise Exception(f"Error parsing JSON data: {str(e)}")
    
    def _calculate_parameter_scores(self, df):
        """Calculate individual parameter scores"""
        scores = {}
        
        for param, ranges in self.optimal_ranges.items():
            if param in df.columns:
                values = df[param].dropna()
                
                if len(values) == 0:
                    scores[param] = {
                        'score': 0.0,
                        'status': 'No Data',
                        'mean_value': None,
                        'readings_count': 0
                    }
                    continue
                
                mean_value = values.mean()
                param_scores = []
                
                for value in values:
                    if ranges['min'] <= value <= ranges['max']:
                        # Optimal range
                        param_scores.append(1.0)
                    elif (self.marginal_ranges[param]['min'] <= value <= 
                          self.marginal_ranges[param]['max']):
                        # Marginal range
                        param_scores.append(0.5)
                    else:
                        # Outside acceptable range
                        param_scores.append(0.0)
                
                avg_score = np.mean(param_scores)
                
                # Determine status
                if avg_score >= 0.8:
                    status = 'Optimal'
                elif avg_score >= 0.5:
                    status = 'Marginal'
                else:
                    status = 'Poor'
                
                scores[param] = {
                    'score': round(avg_score, 3),
                    'status': status,
                    'mean_value': round(mean_value, 2),
                    'min_value': round(values.min(), 2),
                    'max_value': round(values.max(), 2),
                    'readings_count': len(values),
                    'unit': ranges['unit'],
                    'optimal_range': f"{ranges['min']}-{ranges['max']} {ranges['unit']}"
                }
        
        return scores
    
    def _calculate_iot_score(self, parameter_scores):
        """Calculate overall IoT score with weighted parameters"""
        # Weights for different parameters (adjust based on importance for mangroves)
        weights = {
            'soil_moisture': 0.25,
            'temperature': 0.20,
            'salinity': 0.25,
            'ph': 0.15,
            'dissolved_oxygen': 0.15
        }
        
        weighted_sum = 0
        total_weight = 0
        
        for param, weight in weights.items():
            if param in parameter_scores:
                weighted_sum += parameter_scores[param]['score'] * weight
                total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        return weighted_sum / total_weight
    
    def _summarize_data(self, df):
        """Create summary statistics of the sensor data"""
        summary = {
            'total_readings': len(df),
            'parameters_available': list(df.columns),
            'date_range': None,
            'measurement_frequency': None
        }
        
        # Add date range if timestamp available
        if 'timestamp' in df.columns:
            timestamps = pd.to_datetime(df['timestamp'])
            summary['date_range'] = {
                'start': str(timestamps.min()),
                'end': str(timestamps.max()),
                'duration_days': (timestamps.max() - timestamps.min()).days
            }
            
            # Estimate measurement frequency
            if len(timestamps) > 1:
                time_diffs = timestamps.diff().dropna()
                avg_interval = time_diffs.mean()
                summary['measurement_frequency'] = f"Every {avg_interval}"
        
        return summary
    
    def _analyze_trends(self, df):
        """Analyze temporal trends in the data"""
        trends = {}
        
        if 'timestamp' not in df.columns or len(df) < 3:
            return {"message": "Insufficient data for trend analysis"}
        
        df_sorted = df.sort_values('timestamp')
        
        for param in ['soil_moisture', 'temperature', 'salinity', 'ph', 'dissolved_oxygen']:
            if param in df_sorted.columns:
                values = df_sorted[param].dropna()
                if len(values) >= 3:
                    # Simple linear trend
                    x = np.arange(len(values))
                    coeffs = np.polyfit(x, values, 1)
                    slope = coeffs[0]
                    
                    # Classify trend
                    if abs(slope) < 0.01:
                        trend_direction = "Stable"
                    elif slope > 0:
                        trend_direction = "Increasing"
                    else:
                        trend_direction = "Decreasing"
                    
                    trends[param] = {
                        'direction': trend_direction,
                        'slope': round(slope, 4),
                        'recent_value': round(values.iloc[-1], 2),
                        'change_from_start': round(values.iloc[-1] - values.iloc[0], 2)
                    }
        
        return trends
    
    def _classify_health_status(self, iot_score):
        """Classify overall environmental health status"""
        if iot_score >= 0.8:
            return "Excellent"
        elif iot_score >= 0.6:
            return "Good"
        elif iot_score >= 0.4:
            return "Fair"
        elif iot_score >= 0.2:
            return "Poor"
        else:
            return "Critical"
    
    def _generate_insights(self, df, parameter_scores):
        """Generate insights based on sensor data analysis"""
        insights = []
        
        for param, score_info in parameter_scores.items():
            if score_info['score'] >= 0.8:
                insights.append(f"{param.replace('_', ' ').title()} levels are optimal for mangrove growth")
            elif score_info['score'] >= 0.5:
                insights.append(f"{param.replace('_', ' ').title()} levels are marginal - monitor closely")
            else:
                insights.append(f"{param.replace('_', ' ').title()} levels are concerning and need attention")
        
        return insights
    
    def _generate_recommendations(self, parameter_scores):
        """Generate actionable recommendations"""
        recommendations = []
        
        for param, score_info in parameter_scores.items():
            if score_info['score'] < 0.5:
                if param == 'soil_moisture':
                    recommendations.append("Consider improving drainage or irrigation systems")
                elif param == 'temperature':
                    recommendations.append("Monitor temperature variations and consider shading if too hot")
                elif param == 'salinity':
                    recommendations.append("Check freshwater inflow and tidal patterns")
                elif param == 'ph':
                    recommendations.append("Consider soil amendments to adjust pH levels")
                elif param == 'dissolved_oxygen':
                    recommendations.append("Improve water circulation and reduce organic pollution")
        
        if not recommendations:
            recommendations.append("Environmental conditions are suitable for mangrove growth")
        
        return recommendations
    
    def generate_synthetic_data(self, num_readings=100, days_back=30):
        """Generate synthetic IoT data for testing"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        data = []
        for i in range(num_readings):
            # Generate timestamp
            timestamp = start_date + timedelta(
                seconds=random.randint(0, int((end_date - start_date).total_seconds()))
            )
            
            # Generate realistic sensor readings with some correlation and trends
            base_temp = 28 + random.gauss(0, 3)
            
            reading = {
                'timestamp': timestamp.isoformat(),
                'soil_moisture': max(0, min(100, random.gauss(75, 10))),
                'temperature': max(15, min(40, base_temp)),
                'salinity': max(0, min(50, random.gauss(25, 8))),
                'ph': max(5, min(10, random.gauss(7.5, 0.5))),
                'dissolved_oxygen': max(0, min(15, random.gauss(6, 1.5)))
            }
            
            data.append(reading)
        
        return sorted(data, key=lambda x: x['timestamp'])

# Initialize the IoT service
iot_service = IoTSensorService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "IoT Sensor Data API",
        "version": "1.0.0",
        "supported_formats": ["JSON", "CSV"],
        "parameters": list(iot_service.optimal_ranges.keys())
    }), 200

@app.route('/iot', methods=['POST'])
def process_iot_data():
    """
    Main endpoint for IoT data processing
    Accepts JSON or CSV data and returns environmental health scores
    """
    try:
        # Determine data format
        content_type = request.content_type
        
        if 'application/json' in content_type:
            # JSON data
            data = request.get_json()
            if not data:
                return jsonify({
                    "error": "No JSON data provided"
                }), 400
            
            result = iot_service.process_sensor_data(data, 'json')
            
        elif 'multipart/form-data' in content_type:
            # CSV file upload
            if 'file' not in request.files:
                return jsonify({
                    "error": "No CSV file provided"
                }), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({
                    "error": "No file selected"
                }), 400
            
            csv_content = file.read().decode('utf-8')
            result = iot_service.process_sensor_data(csv_content, 'csv')
            
        else:
            return jsonify({
                "error": "Unsupported content type",
                "message": "Please send JSON data or upload a CSV file"
            }), 400
        
        # Add metadata
        result.update({
            "timestamp": datetime.now().isoformat(),
            "data_format": "CSV" if 'multipart/form-data' in content_type else "JSON",
            "status": "success"
        })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "IoT data processing failed",
            "message": str(e),
            "status": "error"
        }), 500

@app.route('/iot/synthetic', methods=['GET'])
def generate_synthetic_iot_data():
    """Generate synthetic IoT sensor data for testing"""
    try:
        num_readings = int(request.args.get('readings', 100))
        days_back = int(request.args.get('days', 30))
        
        synthetic_data = iot_service.generate_synthetic_data(num_readings, days_back)
        
        return jsonify({
            "synthetic_data": synthetic_data,
            "metadata": {
                "readings_count": len(synthetic_data),
                "time_span_days": days_back,
                "parameters": list(iot_service.optimal_ranges.keys())
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to generate synthetic data",
            "message": str(e)
        }), 500

@app.route('/iot/parameters', methods=['GET'])
def get_parameter_info():
    """Get information about supported IoT parameters and their optimal ranges"""
    return jsonify({
        "parameters": iot_service.optimal_ranges,
        "marginal_ranges": iot_service.marginal_ranges,
        "scoring_info": {
            "optimal_range": "Score = 1.0",
            "marginal_range": "Score = 0.5", 
            "outside_range": "Score = 0.0"
        }
    }), 200

if __name__ == '__main__':
    print("Starting EcoLedger IoT Sensor API...")
    app.run(host='0.0.0.0', port=5003, debug=True)