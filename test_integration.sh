#!/bin/bash

echo "🧪 EcoLedger Integration Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASS=0
FAIL=0

# Function to test API endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (Status: $status_code)"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        ((FAIL++))
    fi
}

# Function to test API with JSON response
test_api_json() {
    local name=$1
    local url=$2
    local json_key=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | jq -e ".$json_key" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC} (JSON key '$json_key' found)"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC} (JSON key '$json_key' not found)"
        echo "Response: $response"
        ((FAIL++))
    fi
}

# Wait for services to start if using Docker
if docker-compose ps | grep -q "Up"; then
    echo "🐳 Docker services detected, waiting for startup..."
    sleep 5
fi

echo ""
echo "1️⃣  Testing Service Health Endpoints"
echo "-----------------------------------"

test_endpoint "YOLOv8 Tree Detection API" "http://localhost:5001/health" "200"
test_endpoint "NDVI Vegetation Health API" "http://localhost:5002/health" "200"
test_endpoint "IoT Environmental Data API" "http://localhost:5003/health" "200"
test_endpoint "CO₂ Absorption Calculator API" "http://localhost:5004/health" "200"
test_endpoint "Final Score & Carbon Credits API" "http://localhost:5005/health" "200"
test_endpoint "Blockchain Ledger Service" "http://localhost:5006/health" "200"

echo ""
echo "2️⃣  Testing Demo Endpoints"
echo "--------------------------"

test_api_json "YOLOv8 Demo Tree Count" "http://localhost:5001/demo" "Tree_Count"
test_api_json "NDVI Demo Analysis" "http://localhost:5002/demo" "NDVI_Score"
test_api_json "IoT Demo Analysis" "http://localhost:5003/demo" "IoT_Score"
test_api_json "CO₂ Demo Calculation" "http://localhost:5004/demo" "CO2_absorbed_kg"
test_api_json "Final Score Demo" "http://localhost:5005/demo" "Final_Score"

echo ""
echo "3️⃣  Testing End-to-End Workflow"
echo "-------------------------------"

# Get demo data from each service
echo -n "Collecting AI model outputs... "

TREE_DATA=$(curl -s "http://localhost:5001/demo" 2>/dev/null)
NDVI_DATA=$(curl -s "http://localhost:5002/demo" 2>/dev/null)
IOT_DATA=$(curl -s "http://localhost:5003/demo" 2>/dev/null)

if [ -n "$TREE_DATA" ] && [ -n "$NDVI_DATA" ] && [ -n "$IOT_DATA" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
    
    TREE_COUNT=$(echo "$TREE_DATA" | jq -r '.Tree_Count' 2>/dev/null)
    NDVI_SCORE=$(echo "$NDVI_DATA" | jq -r '.NDVI_Score' 2>/dev/null)
    IOT_SCORE=$(echo "$IOT_DATA" | jq -r '.IoT_Score' 2>/dev/null)
    
    echo "  📊 Tree Count: $TREE_COUNT"
    echo "  🌱 NDVI Score: $NDVI_SCORE"
    echo "  🏭 IoT Score: $IOT_SCORE"
    
    # Test CO₂ calculation
    echo -n "Testing CO₂ calculation pipeline... "
    CO2_RESPONSE=$(curl -s -X POST "http://localhost:5004/co2" \
        -H "Content-Type: application/json" \
        -d "{\"Tree_Count\": $TREE_COUNT}" 2>/dev/null)
    
    if echo "$CO2_RESPONSE" | jq -e '.CO2_absorbed_kg' > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
        
        CO2_ABSORBED=$(echo "$CO2_RESPONSE" | jq -r '.CO2_absorbed_kg')
        echo "  💨 CO₂ Absorbed: $CO2_ABSORBED kg/year"
        
        # Test final score calculation
        echo -n "Testing final score calculation... "
        FINAL_RESPONSE=$(curl -s -X POST "http://localhost:5005/finalscore" \
            -H "Content-Type: application/json" \
            -d "{
                \"Tree_Count\": $TREE_COUNT,
                \"Claimed_Trees\": 50,
                \"NDVI_Score\": $NDVI_SCORE,
                \"IoT_Score\": $IOT_SCORE,
                \"Audit_Check\": 0.85,
                \"CO2_absorbed_kg\": $CO2_ABSORBED
            }" 2>/dev/null)
        
        if echo "$FINAL_RESPONSE" | jq -e '.Final_Score' > /dev/null 2>&1; then
            echo -e "${GREEN}PASS${NC}"
            ((PASS++))
            
            FINAL_SCORE=$(echo "$FINAL_RESPONSE" | jq -r '.Final_Score')
            CARBON_CREDITS=$(echo "$FINAL_RESPONSE" | jq -r '.Carbon_Credits')
            GRADE=$(echo "$FINAL_RESPONSE" | jq -r '.Grade')
            
            echo "  🏆 Final Score: $FINAL_SCORE"
            echo "  💳 Carbon Credits: $CARBON_CREDITS tons"
            echo "  🎖️  Grade: $GRADE"
            
            # Test blockchain submission
            echo -n "Testing blockchain submission... "
            PROJECT_ID="TEST-$(date +%s)"
            LEDGER_RESPONSE=$(curl -s -X POST "http://localhost:5006/ledger/submit" \
                -H "Content-Type: application/json" \
                -d "{
                    \"ngo_id\": \"test-ngo-integration\",
                    \"project_id\": \"$PROJECT_ID\",
                    \"verification_data\": {
                        \"tree_count\": $TREE_COUNT,
                        \"ndvi_score\": $NDVI_SCORE,
                        \"iot_score\": $IOT_SCORE,
                        \"co2_absorbed\": $CO2_ABSORBED,
                        \"final_score\": $FINAL_SCORE,
                        \"carbon_credits\": $CARBON_CREDITS
                    }
                }" 2>/dev/null)
            
            if echo "$LEDGER_RESPONSE" | jq -e '.submitted' > /dev/null 2>&1; then
                echo -e "${GREEN}PASS${NC}"
                ((PASS++))
                
                TX_HASH=$(echo "$LEDGER_RESPONSE" | jq -r '.tx_hash')
                BLOCK_NUMBER=$(echo "$LEDGER_RESPONSE" | jq -r '.block_number')
                
                echo "  🔗 Transaction Hash: ${TX_HASH:0:20}..."
                echo "  📦 Block Number: $BLOCK_NUMBER"
            else
                echo -e "${RED}FAIL${NC}"
                ((FAIL++))
            fi
        else
            echo -e "${RED}FAIL${NC}"
            ((FAIL++))
        fi
    else
        echo -e "${RED}FAIL${NC}"
        ((FAIL++))
    fi
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

echo ""
echo "4️⃣  Testing Blockchain Queries"
echo "-----------------------------"

test_api_json "Blockchain Statistics" "http://localhost:5006/ledger/blockchain" "blockchain_stats"
test_api_json "Carbon Credits List" "http://localhost:5006/ledger/credits?limit=5" "credits"

echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "✅ Passed: ${GREEN}$PASS${NC} tests"
echo -e "❌ Failed: ${RED}$FAIL${NC} tests"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! EcoLedger is ready for the hackathon! 🚀${NC}"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Blockchain Ledger: http://localhost:3000/blockchain-ledger"
    echo ""
    echo "🧪 Test the APIs:"
    echo "   Import the Postman collection from postman_collection/"
    echo "   Or check sample_data/API_Testing_Guide.md"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Check the services and try again.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Make sure all services are running (docker-compose ps)"
    echo "   • Check service logs (docker-compose logs [service-name])"
    echo "   • Restart services (docker-compose restart)"
    exit 1
fi