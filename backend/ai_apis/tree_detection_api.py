"""
EcoLedger - YOLOv8 Tree Detection API
Detects and counts mangrove trees in uploaded images
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import random
import os
from ultralytics import YOLO
import tempfile

app = Flask(__name__)
CORS(app)

class TreeDetectionService:
    def __init__(self):
        # For hackathon: use simulated detection instead of actual YOLO model
        # In production, you would load a fine-tuned YOLOv8 model here
        self.use_simulation = True
        self.model = None
        
        if not self.use_simulation:
            try:
                # Uncomment for actual YOLO model
                # self.model = YOLO('yolov8n.pt')  # or your custom trained model
                pass
            except Exception as e:
                print(f"Could not load YOLO model: {e}")
                self.use_simulation = True

    def detect_trees(self, image_data):
        """Detect trees in the image"""
        if self.use_simulation:
            return self._simulate_tree_detection(image_data)
        else:
            return self._real_tree_detection(image_data)

    def _simulate_tree_detection(self, image_data):
        """Simulate tree detection for hackathon demo"""
        try:
            # Decode the image
            image = Image.open(io.BytesIO(image_data))
            width, height = image.size
            
            # Simulate 20-80 trees based on image characteristics
            # In reality, this would be based on actual detection
            base_count = random.randint(20, 80)
            
            # Generate realistic bounding boxes
            boxes = []
            for i in range(base_count):
                # Random position within image bounds
                x1 = random.randint(0, width - 100)
                y1 = random.randint(0, height - 100)
                x2 = x1 + random.randint(30, 120)  # Tree box width
                y2 = y1 + random.randint(40, 150)  # Tree box height
                
                # Ensure bounds are within image
                x2 = min(x2, width)
                y2 = min(y2, height)
                
                confidence = round(random.uniform(0.65, 0.95), 3)
                
                boxes.append({
                    "label": "mangrove",
                    "confidence": confidence,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                })
            
            return {
                "Tree_Count": len(boxes),
                "Boxes": boxes,
                "Image_Size": {"width": width, "height": height},
                "Detection_Method": "Simulated_YOLOv8"
            }
            
        except Exception as e:
            raise Exception(f"Error in tree detection simulation: {str(e)}")

    def _real_tree_detection(self, image_data):
        """Real YOLO tree detection (for production)"""
        try:
            # Convert image data to OpenCV format
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Run YOLO detection
            results = self.model(image)
            
            boxes = []
            tree_count = 0
            
            for result in results:
                for box in result.boxes:
                    # Filter for tree-like classes (adjust class IDs as needed)
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # In a real scenario, you'd have trained classes for mangroves
                    if confidence > 0.5:  # Confidence threshold
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        boxes.append({
                            "label": "mangrove",
                            "confidence": round(confidence, 3),
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2)
                        })
                        tree_count += 1
            
            return {
                "Tree_Count": tree_count,
                "Boxes": boxes,
                "Image_Size": {"width": image.shape[1], "height": image.shape[0]},
                "Detection_Method": "YOLOv8"
            }
            
        except Exception as e:
            raise Exception(f"Error in YOLO tree detection: {str(e)}")

# Initialize the detection service
detection_service = TreeDetectionService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Tree Detection API",
        "version": "1.0.0",
        "simulation_mode": detection_service.use_simulation
    }), 200

@app.route('/treecount', methods=['POST'])
def count_trees():
    """
    Main endpoint for tree detection and counting
    Accepts image upload and returns tree count with bounding boxes
    """
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            return jsonify({
                "error": "No image file provided",
                "message": "Please upload an image file"
            }), 400
        
        file = request.files['image']
        
        # Validate file
        if file.filename == '':
            return jsonify({
                "error": "No image file selected",
                "message": "Please select an image file"
            }), 400
        
        # Check file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif'}
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        
        if file_extension not in allowed_extensions:
            return jsonify({
                "error": "Invalid file format",
                "message": f"Supported formats: {', '.join(allowed_extensions)}"
            }), 400
        
        # Read image data
        image_data = file.read()
        
        # Validate image size (max 10MB)
        if len(image_data) > 10 * 1024 * 1024:
            return jsonify({
                "error": "File too large",
                "message": "Maximum file size is 10MB"
            }), 400
        
        # Detect trees
        result = detection_service.detect_trees(image_data)
        
        # Add metadata
        result.update({
            "timestamp": str(np.datetime64('now')),
            "filename": file.filename,
            "file_size_bytes": len(image_data),
            "status": "success"
        })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Tree detection failed",
            "message": str(e),
            "status": "error"
        }), 500

@app.route('/treecount/batch', methods=['POST'])
def count_trees_batch():
    """
    Batch processing endpoint for multiple images
    """
    try:
        files = request.files.getlist('images')
        
        if not files:
            return jsonify({
                "error": "No image files provided",
                "message": "Please upload at least one image file"
            }), 400
        
        results = []
        total_trees = 0
        
        for i, file in enumerate(files):
            try:
                image_data = file.read()
                result = detection_service.detect_trees(image_data)
                result['image_index'] = i
                result['filename'] = file.filename
                
                results.append(result)
                total_trees += result['Tree_Count']
                
            except Exception as e:
                results.append({
                    "image_index": i,
                    "filename": file.filename,
                    "error": str(e),
                    "Tree_Count": 0
                })
        
        return jsonify({
            "total_images": len(files),
            "total_trees": total_trees,
            "average_trees_per_image": round(total_trees / len(files), 2),
            "results": results,
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Batch processing failed",
            "message": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    print("Starting EcoLedger Tree Detection API...")
    print(f"Simulation Mode: {detection_service.use_simulation}")
    app.run(host='0.0.0.0', port=5001, debug=True)