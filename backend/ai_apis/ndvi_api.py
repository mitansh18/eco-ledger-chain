"""
EcoLedger - NDVI Vegetation Health API
Calculates Normalized Difference Vegetation Index from satellite/drone images
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import cv2
from PIL import Image
import io
import base64
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import tempfile
import os
import random

app = Flask(__name__)
CORS(app)

class NDVIService:
    def __init__(self):
        self.use_simulation = True  # For hackathon demo
        
    def calculate_ndvi(self, image_data, is_multispectral=False):
        """Calculate NDVI from image data"""
        if self.use_simulation:
            return self._simulate_ndvi(image_data)
        else:
            return self._real_ndvi_calculation(image_data, is_multispectral)
    
    def _simulate_ndvi(self, image_data):
        """Simulate NDVI calculation for hackathon demo"""
        try:
            # Load image to get dimensions
            image = Image.open(io.BytesIO(image_data))
            width, height = image.size
            
            # Simulate realistic NDVI values for mangrove areas
            # Healthy mangroves typically have NDVI 0.4-0.8
            mean_ndvi = random.uniform(0.45, 0.75)
            
            # Generate synthetic NDVI map
            ndvi_map = self._generate_synthetic_ndvi_map(width, height, mean_ndvi)
            
            # Calculate statistics
            ndvi_stats = self._calculate_ndvi_stats(ndvi_map)
            
            # Generate NDVI visualization
            ndvi_map_url = self._create_ndvi_visualization(ndvi_map)
            
            # Normalize NDVI score to 0-1 range for scoring
            # NDVI values range from -1 to 1, we map 0.3-0.8 to 0.5-1.0 score
            ndvi_score = min(1.0, max(0.0, (mean_ndvi + 0.2) / 1.0))
            
            return {
                "NDVI_Score": round(ndvi_score, 3),
                "Mean_NDVI": round(mean_ndvi, 3),
                "NDVI_Stats": ndvi_stats,
                "NDVI_Map_URL": ndvi_map_url,
                "Image_Size": {"width": width, "height": height},
                "Calculation_Method": "Simulated_Multispectral",
                "Health_Classification": self._classify_vegetation_health(mean_ndvi)
            }
            
        except Exception as e:
            raise Exception(f"Error in NDVI simulation: {str(e)}")
    
    def _generate_synthetic_ndvi_map(self, width, height, base_ndvi):
        """Generate realistic NDVI map with spatial variation"""
        # Create base map
        ndvi_map = np.full((height, width), base_ndvi)
        
        # Add realistic spatial variation
        # Healthy patches (higher NDVI)
        for _ in range(random.randint(3, 8)):
            center_x = random.randint(width//4, 3*width//4)
            center_y = random.randint(height//4, 3*height//4)
            radius = random.randint(min(width, height)//8, min(width, height)//4)
            
            y, x = np.ogrid[:height, :width]
            mask = (x - center_x)**2 + (y - center_y)**2 <= radius**2
            ndvi_map[mask] += random.uniform(0.1, 0.25)
        
        # Degraded patches (lower NDVI)
        for _ in range(random.randint(2, 5)):
            center_x = random.randint(0, width)
            center_y = random.randint(0, height)
            radius = random.randint(min(width, height)//12, min(width, height)//6)
            
            y, x = np.ogrid[:height, :width]
            mask = (x - center_x)**2 + (y - center_y)**2 <= radius**2
            ndvi_map[mask] -= random.uniform(0.1, 0.3)
        
        # Add noise
        noise = np.random.normal(0, 0.05, (height, width))
        ndvi_map += noise
        
        # Clip to valid NDVI range
        ndvi_map = np.clip(ndvi_map, -1, 1)
        
        return ndvi_map
    
    def _calculate_ndvi_stats(self, ndvi_map):
        """Calculate comprehensive NDVI statistics"""
        return {
            "min": float(np.min(ndvi_map)),
            "max": float(np.max(ndvi_map)),
            "mean": float(np.mean(ndvi_map)),
            "median": float(np.median(ndvi_map)),
            "std": float(np.std(ndvi_map)),
            "percentile_25": float(np.percentile(ndvi_map, 25)),
            "percentile_75": float(np.percentile(ndvi_map, 75)),
            "healthy_vegetation_percentage": float(np.sum(ndvi_map > 0.4) / ndvi_map.size * 100),
            "degraded_vegetation_percentage": float(np.sum(ndvi_map < 0.2) / ndvi_map.size * 100)
        }
    
    def _create_ndvi_visualization(self, ndvi_map):
        """Create NDVI visualization and return base64 encoded image"""
        try:
            plt.figure(figsize=(10, 8))
            
            # Create NDVI plot with custom colormap
            im = plt.imshow(ndvi_map, cmap='RdYlGn', vmin=-1, vmax=1)
            plt.colorbar(im, label='NDVI Value', shrink=0.8)
            plt.title('NDVI Map - Vegetation Health Index')
            plt.xlabel('X (pixels)')
            plt.ylabel('Y (pixels)')
            
            # Save to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            
            # Encode to base64
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            print(f"Error creating NDVI visualization: {e}")
            return None
    
    def _classify_vegetation_health(self, mean_ndvi):
        """Classify vegetation health based on NDVI value"""
        if mean_ndvi >= 0.6:
            return "Excellent"
        elif mean_ndvi >= 0.4:
            return "Good" 
        elif mean_ndvi >= 0.2:
            return "Fair"
        elif mean_ndvi >= 0.0:
            return "Poor"
        else:
            return "Very Poor"
    
    def _real_ndvi_calculation(self, image_data, is_multispectral):
        """Real NDVI calculation from multispectral image"""
        try:
            # For real implementation with multispectral data
            # This would parse NIR and RED bands from the image
            
            if is_multispectral:
                # Parse multispectral image (e.g., GeoTIFF with multiple bands)
                # bands = parse_multispectral_image(image_data)
                # nir = bands['NIR']
                # red = bands['RED']
                pass
            else:
                # Estimate from RGB image (less accurate)
                image = Image.open(io.BytesIO(image_data))
                img_array = np.array(image)
                
                if len(img_array.shape) == 3:
                    # Use red channel as RED, and estimate NIR from green
                    red = img_array[:, :, 0].astype(float)
                    nir = img_array[:, :, 1].astype(float) * 1.2  # Rough estimation
                else:
                    raise ValueError("Image must be RGB for NDVI calculation")
            
            # Calculate NDVI: (NIR - RED) / (NIR + RED)
            # Avoid division by zero
            denominator = nir + red
            ndvi = np.where(denominator != 0, (nir - red) / denominator, 0)
            
            # Clip to valid range
            ndvi = np.clip(ndvi, -1, 1)
            
            # Calculate statistics and create visualization
            ndvi_stats = self._calculate_ndvi_stats(ndvi)
            ndvi_map_url = self._create_ndvi_visualization(ndvi)
            
            mean_ndvi = np.mean(ndvi)
            ndvi_score = min(1.0, max(0.0, (mean_ndvi + 0.2) / 1.0))
            
            return {
                "NDVI_Score": round(ndvi_score, 3),
                "Mean_NDVI": round(mean_ndvi, 3),
                "NDVI_Stats": ndvi_stats,
                "NDVI_Map_URL": ndvi_map_url,
                "Image_Size": {"width": image.size[0], "height": image.size[1]},
                "Calculation_Method": "Real_Multispectral" if is_multispectral else "RGB_Estimation",
                "Health_Classification": self._classify_vegetation_health(mean_ndvi)
            }
            
        except Exception as e:
            raise Exception(f"Error in real NDVI calculation: {str(e)}")

# Initialize the NDVI service
ndvi_service = NDVIService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "NDVI Vegetation Health API",
        "version": "1.0.0",
        "simulation_mode": ndvi_service.use_simulation
    }), 200

@app.route('/ndvi', methods=['POST'])
def calculate_ndvi():
    """
    Main endpoint for NDVI calculation
    Accepts satellite/drone image and returns vegetation health metrics
    """
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            return jsonify({
                "error": "No image file provided",
                "message": "Please upload a satellite or drone image"
            }), 400
        
        file = request.files['image']
        
        # Validate file
        if file.filename == '':
            return jsonify({
                "error": "No image file selected"
            }), 400
        
        # Check if it's multispectral
        is_multispectral = request.form.get('multispectral', 'false').lower() == 'true'
        
        # Read image data
        image_data = file.read()
        
        # Validate image size
        if len(image_data) > 20 * 1024 * 1024:  # 20MB limit for satellite images
            return jsonify({
                "error": "File too large",
                "message": "Maximum file size is 20MB"
            }), 400
        
        # Calculate NDVI
        result = ndvi_service.calculate_ndvi(image_data, is_multispectral)
        
        # Add metadata
        result.update({
            "timestamp": str(np.datetime64('now')),
            "filename": file.filename,
            "file_size_bytes": len(image_data),
            "is_multispectral": is_multispectral,
            "status": "success"
        })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "NDVI calculation failed",
            "message": str(e),
            "status": "error"
        }), 500

@app.route('/ndvi/info', methods=['GET'])
def ndvi_info():
    """Information about NDVI calculation"""
    return jsonify({
        "about": "Normalized Difference Vegetation Index (NDVI)",
        "formula": "(NIR - RED) / (NIR + RED)",
        "range": "[-1, 1]",
        "interpretation": {
            "0.6 - 1.0": "Dense, healthy vegetation",
            "0.4 - 0.6": "Moderate vegetation",
            "0.2 - 0.4": "Sparse vegetation", 
            "0.0 - 0.2": "Very sparse vegetation",
            "-1.0 - 0.0": "Water, clouds, snow, or bare soil"
        },
        "mangrove_typical_range": "0.4 - 0.8",
        "supported_formats": ["TIFF", "GeoTIFF", "JPG", "PNG"],
        "multispectral_support": True
    }), 200

if __name__ == '__main__':
    print("Starting EcoLedger NDVI API...")
    print(f"Simulation Mode: {ndvi_service.use_simulation}")
    app.run(host='0.0.0.0', port=5002, debug=True)