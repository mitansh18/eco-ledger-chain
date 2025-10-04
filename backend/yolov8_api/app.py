from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import os
import logging
from werkzeug.utils import secure_filename
import tempfile

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

# Load YOLOv8 model (using pre-trained for hackathon speed)
# In production, this would be fine-tuned for mangrove detection
try:
    model = YOLO('yolov8n.pt')  # Using nano model for speed
    logger.info("YOLOv8 model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLOv8 model: {e}")
    model = None

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def simulate_mangrove_detection(image_path, tree_count_override=None):
    """
    Simulates mangrove tree detection for hackathon demo.
    In production, this would use a fine-tuned YOLOv8 model.
    """
    try:
        # Load image to get dimensions
        img = cv2.imread(image_path)
        if img is None:
            return {"Tree_Count": 0, "Boxes": [], "error": "Could not load image"}
        
        h, w = img.shape[:2]
        
        # Simulate tree detection based on image characteristics
        # More green areas = more trees detected
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define range for green color (vegetation)
        lower_green = np.array([40, 40, 40])
        upper_green = np.array([80, 255, 255])
        
        # Create mask for green areas
        mask = cv2.inRange(hsv, lower_green, upper_green)
        green_pixels = cv2.countNonZero(mask)
        total_pixels = h * w
        green_ratio = green_pixels / total_pixels
        
        # Estimate tree count based on green coverage
        if tree_count_override:
            tree_count = tree_count_override
        else:
            # Base estimation: more green = more trees
            base_count = max(1, int(green_ratio * 50))  # Scale factor for demo
            tree_count = np.random.randint(max(1, base_count - 5), base_count + 10)
        
        # Generate simulated bounding boxes
        boxes = []
        for i in range(tree_count):
            # Random positions for demo
            x1 = np.random.randint(0, w - 50)
            y1 = np.random.randint(0, h - 50)
            x2 = x1 + np.random.randint(30, 80)
            y2 = y1 + np.random.randint(30, 80)
            
            # Ensure boxes are within image bounds
            x2 = min(x2, w)
            y2 = min(y2, h)
            
            confidence = np.random.uniform(0.7, 0.95)  # High confidence for demo
            
            boxes.append({
                "label": "mangrove",
                "confidence": round(confidence, 3),
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2)
            })
        
        return {
            "Tree_Count": tree_count,
            "Boxes": boxes,
            "green_coverage": round(green_ratio, 3),
            "image_dimensions": {"width": w, "height": h}
        }
        
    except Exception as e:
        logger.error(f"Error in mangrove detection: {e}")
        return {"Tree_Count": 0, "Boxes": [], "error": str(e)}

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "YOLOv8 Tree Detection API",
        "model_loaded": model is not None
    })

@app.route('/treecount', methods=['POST'])
def count_trees():
    try:
        # Check if file was uploaded
        if 'image' not in request.files:
            return jsonify({
                "error": "No image file provided",
                "Tree_Count": 0,
                "Boxes": []
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                "error": "No file selected",
                "Tree_Count": 0,
                "Boxes": []
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "error": "Invalid file type. Allowed types: png, jpg, jpeg, bmp, tiff",
                "Tree_Count": 0,
                "Boxes": []
            }), 400
        
        # Get optional parameters
        claimed_trees = request.form.get('claimed_trees', type=int)
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}")
        file.save(temp_file.name)
        
        try:
            # Detect trees in the image
            result = simulate_mangrove_detection(temp_file.name)
            
            # Add metadata
            result.update({
                "filename": filename,
                "claimed_trees": claimed_trees,
                "timestamp": str(np.datetime64('now'))
            })
            
            logger.info(f"Processed image {filename}: {result['Tree_Count']} trees detected")
            
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file.name)
            
    except Exception as e:
        logger.error(f"Error processing tree count request: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "Tree_Count": 0,
            "Boxes": []
        }), 500

@app.route('/demo', methods=['GET'])
def demo_endpoint():
    """Demo endpoint with sample data"""
    return jsonify({
        "Tree_Count": 45,
        "Boxes": [
            {"label": "mangrove", "confidence": 0.892, "x1": 120, "y1": 80, "x2": 180, "y2": 140},
            {"label": "mangrove", "confidence": 0.834, "x1": 250, "y1": 120, "x2": 310, "y2": 180},
            {"label": "mangrove", "confidence": 0.756, "x1": 380, "y1": 200, "x2": 440, "y2": 260}
        ],
        "green_coverage": 0.67,
        "image_dimensions": {"width": 800, "height": 600},
        "filename": "demo_mangrove_forest.jpg",
        "timestamp": str(np.datetime64('now'))
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)