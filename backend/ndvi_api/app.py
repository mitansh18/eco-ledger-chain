from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import logging
from werkzeug.utils import secure_filename
import tempfile
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'tiff'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_ndvi(image_path):
    """
    Calculate NDVI (Normalized Difference Vegetation Index) from satellite/drone imagery.
    NDVI = (NIR - RED) / (NIR + RED)
    
    For hackathon demo, we'll simulate NIR channel from green channel
    and use red channel directly.
    """
    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            return None, None, "Could not load image"
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # For demo purposes, simulate NIR and RED channels
        # In real satellite imagery, these would be separate spectral bands
        blue, green, red = cv2.split(img)
        
        # Simulate NIR channel using green channel (vegetation reflects more in NIR)
        # Add some enhancement to green areas to simulate NIR
        nir_simulated = green.astype(np.float32)
        
        # Enhance areas with high green content (simulating NIR response)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        green_mask = cv2.inRange(hsv, (40, 40, 40), (80, 255, 255))
        nir_simulated[green_mask > 0] *= 1.3  # Boost NIR in vegetated areas
        
        # Convert to float for calculation
        nir = nir_simulated.astype(np.float32)
        red_float = red.astype(np.float32)
        
        # Calculate NDVI: (NIR - RED) / (NIR + RED)
        # Add small epsilon to avoid division by zero
        epsilon = 1e-6
        ndvi = (nir - red_float) / (nir + red_float + epsilon)
        
        # Clip values to valid NDVI range [-1, 1]
        ndvi = np.clip(ndvi, -1, 1)
        
        # Normalize to [0, 1] for scoring
        ndvi_normalized = (ndvi + 1) / 2
        
        # Calculate mean NDVI
        mean_ndvi = np.mean(ndvi)
        mean_ndvi_normalized = np.mean(ndvi_normalized)
        
        # Generate NDVI visualization
        # Map NDVI values to color scale (blue = low, green = high)
        ndvi_colored = cv2.applyColorMap(
            (ndvi_normalized * 255).astype(np.uint8), 
            cv2.COLORMAP_RdYlGn
        )
        
        # Convert to base64 for web display
        _, buffer = cv2.imencode('.png', ndvi_colored)
        ndvi_base64 = base64.b64encode(buffer).decode('utf-8')
        ndvi_map_url = f"data:image/png;base64,{ndvi_base64}"
        
        # Calculate vegetation health score (0-1)
        # Higher NDVI values indicate healthier vegetation
        vegetation_pixels = np.sum(ndvi_normalized > 0.3)  # Threshold for vegetation
        total_pixels = ndvi_normalized.size
        vegetation_coverage = vegetation_pixels / total_pixels
        
        # Health score combines mean NDVI and coverage
        health_score = (mean_ndvi_normalized * 0.7) + (vegetation_coverage * 0.3)
        health_score = np.clip(health_score, 0, 1)
        
        return {
            "NDVI_Score": round(float(health_score), 4),
            "Mean_NDVI": round(float(mean_ndvi), 4),
            "Mean_NDVI_Normalized": round(float(mean_ndvi_normalized), 4),
            "Vegetation_Coverage": round(float(vegetation_coverage), 4),
            "NDVI_Map_URL": ndvi_map_url,
            "Statistics": {
                "min_ndvi": round(float(np.min(ndvi)), 4),
                "max_ndvi": round(float(np.max(ndvi)), 4),
                "std_ndvi": round(float(np.std(ndvi)), 4)
            }
        }, ndvi_colored, None
        
    except Exception as e:
        logger.error(f"Error calculating NDVI: {e}")
        return None, None, str(e)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "NDVI Vegetation Health API"
    })

@app.route('/ndvi', methods=['POST'])
def calculate_ndvi_endpoint():
    try:
        # Check if file was uploaded
        if 'image' not in request.files:
            return jsonify({
                "error": "No image file provided",
                "NDVI_Score": 0.0,
                "Mean_NDVI": 0.0,
                "NDVI_Map_URL": ""
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                "error": "No file selected",
                "NDVI_Score": 0.0,
                "Mean_NDVI": 0.0,
                "NDVI_Map_URL": ""
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "error": "Invalid file type. Allowed types: png, jpg, jpeg, bmp, tiff",
                "NDVI_Score": 0.0,
                "Mean_NDVI": 0.0,
                "NDVI_Map_URL": ""
            }), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}")
        file.save(temp_file.name)
        
        try:
            # Calculate NDVI
            result, ndvi_image, error = calculate_ndvi(temp_file.name)
            
            if error:
                return jsonify({
                    "error": error,
                    "NDVI_Score": 0.0,
                    "Mean_NDVI": 0.0,
                    "NDVI_Map_URL": ""
                }), 500
            
            # Add metadata
            result.update({
                "filename": filename,
                "timestamp": str(np.datetime64('now')),
                "processing_info": {
                    "method": "Simulated NIR from RGB for demo",
                    "note": "Production version would use true multispectral imagery"
                }
            })
            
            logger.info(f"Processed NDVI for {filename}: Score = {result['NDVI_Score']}")
            
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file.name)
            
    except Exception as e:
        logger.error(f"Error processing NDVI request: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "NDVI_Score": 0.0,
            "Mean_NDVI": 0.0,
            "NDVI_Map_URL": ""
        }), 500

@app.route('/demo', methods=['GET'])
def demo_endpoint():
    """Demo endpoint with sample NDVI data"""
    
    # Create a sample NDVI visualization
    sample_ndvi = np.random.uniform(0.3, 0.9, (200, 200))  # Healthy vegetation range
    ndvi_colored = cv2.applyColorMap((sample_ndvi * 255).astype(np.uint8), cv2.COLORMAP_RdYlGn)
    
    _, buffer = cv2.imencode('.png', ndvi_colored)
    ndvi_base64 = base64.b64encode(buffer).decode('utf-8')
    ndvi_map_url = f"data:image/png;base64,{ndvi_base64}"
    
    return jsonify({
        "NDVI_Score": 0.742,
        "Mean_NDVI": 0.485,
        "Mean_NDVI_Normalized": 0.742,
        "Vegetation_Coverage": 0.823,
        "NDVI_Map_URL": ndvi_map_url,
        "Statistics": {
            "min_ndvi": 0.125,
            "max_ndvi": 0.891,
            "std_ndvi": 0.156
        },
        "filename": "demo_satellite_image.jpg",
        "timestamp": str(np.datetime64('now')),
        "processing_info": {
            "method": "Demo data generation",
            "note": "This is simulated NDVI data for demonstration"
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)