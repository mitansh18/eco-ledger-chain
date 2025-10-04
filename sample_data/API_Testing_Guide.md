# EcoLedger API Testing Guide

## Quick Test Commands

### 1. Check All Services Are Running
```bash
# Test all health endpoints
curl http://localhost:5001/health  # YOLOv8 Tree Detection
curl http://localhost:5002/health  # NDVI Vegetation Health
curl http://localhost:5003/health  # IoT Environmental Data
curl http://localhost:5004/health  # CO₂ Absorption Calculator
curl http://localhost:5005/health  # Final Score & Carbon Credits
curl http://localhost:5006/health  # Blockchain Ledger Service
```

### 2. Run Demo Endpoints
```bash
# Get demo data from each service
curl http://localhost:5001/demo  # Sample tree detection results
curl http://localhost:5002/demo  # Sample NDVI analysis
curl http://localhost:5003/demo  # Sample IoT scoring
curl http://localhost:5004/demo  # Sample CO₂ calculation
curl http://localhost:5005/demo  # Sample final score
```

### 3. Complete End-to-End Test
```bash
# Step 1: Tree Detection
TREE_COUNT=$(curl -s http://localhost:5001/demo | jq -r '.Tree_Count')
echo "Tree Count: $TREE_COUNT"

# Step 2: NDVI Analysis  
NDVI_SCORE=$(curl -s http://localhost:5002/demo | jq -r '.NDVI_Score')
echo "NDVI Score: $NDVI_SCORE"

# Step 3: IoT Analysis
IOT_SCORE=$(curl -s http://localhost:5003/demo | jq -r '.IoT_Score')
echo "IoT Score: $IOT_SCORE"

# Step 4: CO₂ Calculation
CO2_DATA=$(curl -s -X POST http://localhost:5004/co2 \
  -H "Content-Type: application/json" \
  -d "{\"Tree_Count\": $TREE_COUNT}")
CO2_ABSORBED=$(echo $CO2_DATA | jq -r '.CO2_absorbed_kg')
echo "CO₂ Absorbed: $CO2_ABSORBED kg"

# Step 5: Final Score
FINAL_DATA=$(curl -s -X POST http://localhost:5005/finalscore \
  -H "Content-Type: application/json" \
  -d "{
    \"Tree_Count\": $TREE_COUNT,
    \"Claimed_Trees\": 50,
    \"NDVI_Score\": $NDVI_SCORE,
    \"IoT_Score\": $IOT_SCORE,
    \"Audit_Check\": 0.85,
    \"CO2_absorbed_kg\": $CO2_ABSORBED
  }")
FINAL_SCORE=$(echo $FINAL_DATA | jq -r '.Final_Score')
CARBON_CREDITS=$(echo $FINAL_DATA | jq -r '.Carbon_Credits')
echo "Final Score: $FINAL_SCORE"
echo "Carbon Credits: $CARBON_CREDITS"

# Step 6: Submit to Blockchain
LEDGER_DATA=$(curl -s -X POST http://localhost:5006/ledger/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"ngo_id\": \"test-ngo-123\",
    \"project_id\": \"PRJ-TEST-$(date +%s)\",
    \"verification_data\": {
      \"tree_count\": $TREE_COUNT,
      \"ndvi_score\": $NDVI_SCORE,
      \"iot_score\": $IOT_SCORE,
      \"co2_absorbed\": $CO2_ABSORBED,
      \"final_score\": $FINAL_SCORE,
      \"carbon_credits\": $CARBON_CREDITS
    }
  }")
TX_HASH=$(echo $LEDGER_DATA | jq -r '.tx_hash')
echo "Blockchain TX Hash: $TX_HASH"

echo ""
echo "🎉 End-to-End Test Complete!"
echo "   Trees Detected: $TREE_COUNT"
echo "   Final Score: $FINAL_SCORE"
echo "   Carbon Credits: $CARBON_CREDITS"
echo "   Blockchain TX: $TX_HASH"
```

### 4. Test File Uploads
```bash
# Test with sample IoT data
curl -X POST http://localhost:5003/iot \
  -F "file=@sample_data/sample_iot_data.csv"

# Test with JSON IoT data
curl -X POST http://localhost:5003/iot \
  -H "Content-Type: application/json" \
  -d '{
    "soil_moisture": 72.5,
    "temperature": 29.2,
    "salinity": 18.4,
    "ph": 7.1,
    "dissolved_oxygen": 6.2,
    "conductivity": 28.3
  }'
```

### 5. Blockchain Operations
```bash
# Get blockchain stats
curl http://localhost:5006/ledger/blockchain

# List available carbon credits
curl http://localhost:5006/ledger/credits

# Issue carbon credits
curl -X POST http://localhost:5006/ledger/issue \
  -H "Content-Type: application/json" \
  -d '{
    "ngo_id": "test-ngo-123",
    "project_id": "PRJ-TEST-001", 
    "credits_amount": 0.5,
    "verification_score": 0.85,
    "co2_absorbed": 615.0,
    "tree_count": 50,
    "project_location": "Test Location"
  }'
```

## Expected Results

### Healthy Response (All Services)
```json
{
  "status": "healthy",
  "service": "Service Name API"
}
```

### Sample Tree Detection Response
```json
{
  "Tree_Count": 45,
  "Boxes": [...],
  "green_coverage": 0.67,
  "image_dimensions": {"width": 800, "height": 600}
}
```

### Sample Final Score Response
```json
{
  "Final_Score": 0.756,
  "Grade": "B+",
  "Carbon_Credits": 0.418,
  "CO2_absorbed_kg": 553.5,
  "Scores_Breakdown": {
    "ai_tree_score": 0.9,
    "ndvi_score": 0.742,
    "iot_score": 0.658,
    "audit_check": 0.85
  }
}
```

## Troubleshooting

### Service Not Responding
```bash
# Check if service is running
docker-compose ps

# View service logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Common Port Issues
If you get "connection refused" errors, check if ports are available:
```bash
# Check what's running on each port
netstat -tulpn | grep :500[1-6]

# Kill process using port (if needed)
sudo kill -9 $(lsof -t -i:5001)
```

## Performance Testing

### Load Testing with curl
```bash
# Test API performance
for i in {1..10}; do
  time curl -s http://localhost:5001/demo > /dev/null
done

# Concurrent requests
for i in {1..5}; do
  curl -s http://localhost:5005/demo &
done
wait
```

### Memory and CPU Usage
```bash
# Monitor Docker containers
docker stats

# Check individual service resource usage
docker-compose top
```