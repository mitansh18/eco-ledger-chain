#!/bin/bash

echo "🌱 Starting EcoLedger Carbon Credit Verification Platform..."

# Check if Docker is available
if command -v docker-compose &> /dev/null; then
    echo "📦 Using Docker Compose for setup..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    echo "🔍 Checking service health..."
    for port in 5001 5002 5003 5004 5005 5006; do
        if curl -s "http://localhost:$port/health" > /dev/null; then
            echo "✅ Service on port $port is healthy"
        else
            echo "❌ Service on port $port is not responding"
        fi
    done
    
    echo ""
    echo "🚀 EcoLedger is now running!"
    echo "   Frontend: http://localhost:3000"
    echo "   API Documentation: See README.md"
    echo ""
    echo "🧪 To test the APIs:"
    echo "   Import postman_collection/EcoLedger_APIs.postman_collection.json"
    echo "   Run the 'Complete End-to-End Workflow' tests"
    
else
    echo "⚠️  Docker not found. Please install Docker and Docker Compose."
    echo "   Or run services manually - see README.md for instructions."
    exit 1
fi