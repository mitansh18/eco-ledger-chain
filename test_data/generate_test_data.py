# Test Data Generation Script for EcoLedger

import json
import csv
import random
from datetime import datetime, timedelta
import os

def generate_synthetic_iot_data(filename='synthetic_iot_data.csv', num_readings=100, days_back=30):
    """Generate synthetic IoT sensor data"""
    data = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    for i in range(num_readings):
        # Generate timestamp
        timestamp = start_date + timedelta(
            seconds=random.randint(0, int((end_date - start_date).total_seconds()))
        )
        
        # Generate realistic sensor readings with some correlation
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
    
    # Sort by timestamp
    data.sort(key=lambda x: x['timestamp'])
    
    # Write CSV
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = ['timestamp', 'soil_moisture', 'temperature', 'salinity', 'ph', 'dissolved_oxygen']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for row in data:
            writer.writerow(row)
    
    print(f"Generated {num_readings} IoT readings in {filename}")
    return data

def generate_test_project_data():
    """Generate test project data"""
    projects = [
        {
            'ngo_id': 'NGO_MANGROVE_001',
            'project_id': 'PROJ_2024_001',
            'project_name': 'Sundarbans Restoration Project',
            'claimed_trees': 1200,
            'audit_check': 0.85,
            'location': 'West Bengal, India',
            'area_hectares': 150
        },
        {
            'ngo_id': 'NGO_COASTAL_002',
            'project_id': 'PROJ_2024_002', 
            'project_name': 'Kerala Backwaters Mangrove Project',
            'claimed_trees': 800,
            'audit_check': 0.78,
            'location': 'Kerala, India',
            'area_hectares': 95
        },
        {
            'ngo_id': 'NGO_CONSERVATION_003',
            'project_id': 'PROJ_2024_003',
            'project_name': 'Mumbai Coastal Protection Initiative',
            'claimed_trees': 1500,
            'audit_check': 0.92,
            'location': 'Maharashtra, India',
            'area_hectares': 200
        }
    ]
    
    with open('test_projects.json', 'w') as f:
        json.dump(projects, f, indent=2)
    
    print(f"Generated test project data in test_projects.json")
    return projects

def create_sample_verification_flow():
    """Create sample data for complete verification flow"""
    
    # Sample verification request
    verification_request = {
        "ngo_id": "NGO_MANGROVE_001",
        "project_id": "PROJ_2024_001",
        "project_name": "Sundarbans Restoration Project",
        "claimed_trees": 1200,
        "audit_check": 0.85,
        "tree_detection_params": {
            "image_file": "sample_mangrove_image.jpg"
        },
        "ndvi_params": {
            "image_file": "sample_ndvi_image.tiff",
            "multispectral": False
        },
        "iot_params": {
            "data_file": "synthetic_iot_data.csv"
        }
    }
    
    # Expected verification results
    expected_results = {
        "tree_detection": {
            "Tree_Count": 1024,
            "Detection_Method": "Simulated_YOLOv8"
        },
        "ndvi_analysis": {
            "NDVI_Score": 0.82,
            "Health_Classification": "Good"
        },
        "iot_analysis": {
            "IoT_Score": 0.75,
            "Health_Status": "Good"
        },
        "co2_calculation": {
            "CO2_absorbed_kg": 12595.2
        },
        "final_score_calculation": {
            "Final_Score": 0.812,
            "Carbon_Credits": 10.235,
            "Individual_Scores": {
                "AI_Tree_Score": 0.853,
                "NDVI_Score": 0.82,
                "IoT_Score": 0.75,
                "Audit_Check": 0.85
            }
        }
    }
    
    sample_flow = {
        "verification_request": verification_request,
        "expected_results": expected_results
    }
    
    with open('sample_verification_flow.json', 'w') as f:
        json.dump(sample_flow, f, indent=2)
    
    print("Generated sample verification flow in sample_verification_flow.json")
    return sample_flow

if __name__ == "__main__":
    # Create test data directory if it doesn't exist
    os.makedirs('test_data', exist_ok=True)
    os.chdir('test_data')
    
    print("Generating EcoLedger test data...")
    
    # Generate IoT data
    generate_synthetic_iot_data()
    
    # Generate project data
    generate_test_project_data()
    
    # Generate sample verification flow
    create_sample_verification_flow()
    
    print("\nAll test data generated successfully!")
    print("Files created:")
    print("- synthetic_iot_data.csv")
    print("- test_projects.json") 
    print("- sample_verification_flow.json")