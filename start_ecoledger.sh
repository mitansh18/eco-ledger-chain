#!/bin/bash

# EcoLedger Dynamic Platform Startup Script
# This script starts all services for the EcoLedger platform

echo "🌿 EcoLedger - AI-Powered Dynamic Carbon Credit Verification Platform"
echo "=================================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"
echo ""

# Generate test data
echo "📊 Generating test data..."
cd test_data
python3 generate_test_data.py
cd ..
echo "✅ Test data generated"
echo ""

# Build and start all services
echo "🚀 Starting EcoLedger Platform..."
echo "Building and starting all services with Docker Compose..."
echo ""

docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo ""
echo "🔍 Checking service health..."
echo ""

services=(
    "Dynamic Dataset API:http://localhost:5007/health"
    "Tree Detection API:http://localhost:5001/health"
    "NDVI API:http://localhost:5002/health"
    "IoT API:http://localhost:5003/health"
    "CO₂ API:http://localhost:5004/health"
    "Final Score API:http://localhost:5005/health"
    "Blockchain API:http://localhost:5006/health"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    url=$(echo $service | cut -d: -f2,3)
    
    if curl -s "$url" > /dev/null; then
        echo "✅ $name - Healthy"
    else
        echo "❌ $name - Not responding"
    fi
done

echo ""
echo "🎉 EcoLedger Platform is ready!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo ""
echo "🔧 API Endpoints:"
echo "   Dynamic Dataset API: http://localhost:5007"
echo "   Tree Detection API: http://localhost:5001"
echo "   NDVI API: http://localhost:5002"
echo "   IoT API: http://localhost:5003"
echo "   CO₂ API: http://localhost:5004"
echo "   Final Score API: http://localhost:5005"
echo "   Blockchain API: http://localhost:5006"
echo ""
echo "📋 Features:"
echo "   🧠 Smart Dataset Upload - Upload ANY environmental dataset"
echo "   🌱 Traditional Upload - Standard mangrove project submission"
echo "   📊 Verification Dashboard - View results and analytics"
echo "   🛒 Carbon Credits Marketplace - Trade verified credits"
echo ""
echo "📖 Usage:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Try the 'Smart Dataset Upload' tab"
echo "   3. Upload any environmental files (images, CSV, JSON, etc.)"
echo "   4. Watch the AI automatically detect and verify your data!"
echo ""
echo "🛑 To stop all services: docker-compose down"
echo ""