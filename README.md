# EcoLedger - Carbon Credit Verification Platform

<p align="center">
  <img src="https://img.shields.io/badge/AI-YOLOv8%20%7C%20NDVI-blue" alt="AI Models">
  <img src="https://img.shields.io/badge/Blockchain-Hyperledger%20Simulation-green" alt="Blockchain">
  <img src="https://img.shields.io/badge/Frontend-Next.js%20%7C%20React%20%7C%20TypeScript-purple" alt="Frontend">
  <img src="https://img.shields.io/badge/Backend-Python%20%7C%20Flask-yellow" alt="Backend">
  <img src="https://img.shields.io/badge/Status-Hackathon%20Ready-brightgreen" alt="Status">
</p>

**EcoLedger** is a complete web application for verifying mangrove plantation projects and issuing carbon credits using AI verification models and blockchain technology. Built for hackathons and environmental impact initiatives.

## 🌟 Features

### 🤖 AI Verification Pipeline
- **YOLOv8 Tree Detection**: Counts mangrove trees from drone/satellite images
- **NDVI Vegetation Health**: Analyzes vegetation health using multispectral imagery  
- **IoT Environmental Scoring**: Processes soil moisture, temperature, salinity data
- **CO₂ Absorption Calculator**: Estimates carbon sequestration based on verified tree count

### 🔗 Blockchain Integration
- **Immutable Verification Records**: Store project data on simulated blockchain
- **Carbon Credit Issuance**: Automated credit generation based on AI scores
- **Transparent Transfers**: Track ownership and transfers on the ledger
- **Smart Scoring**: Weighted final score: 40% AI trees + 30% NDVI + 20% IoT + 10% audit

### 🎯 Complete Workflow
1. **NGO Dashboard**: Upload project data (images, sensor data, location)
2. **AI Processing**: Automated verification through multiple AI models
3. **Final Scoring**: Combined weighted score with grade (A+ to D)
4. **Blockchain Storage**: Immutable record with transaction hash
5. **Credit Marketplace**: Companies can browse and purchase verified credits
6. **Real-time Tracking**: Monitor project status and carbon impact

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Frontend      │    │    AI Services       │    │  Blockchain     │
│   (Next.js)     │◄──►│  ┌─────────────────┐  │◄──►│  Ledger Service │
│                 │    │  │ YOLOv8 API      │  │    │                 │
│ • NGO Dashboard │    │  │ (Port 5001)     │  │    │ • Verification  │
│ • Marketplace   │    │  ├─────────────────┤  │    │ • Credit Issue  │
│ • Blockchain    │    │  │ NDVI API        │  │    │ • Transfers     │
│   Viewer        │    │  │ (Port 5002)     │  │    │ • Query Records │
└─────────────────┘    │  ├─────────────────┤  │    └─────────────────┘
                       │  │ IoT API         │  │
                       │  │ (Port 5003)     │  │
                       │  ├─────────────────┤  │
                       │  │ CO₂ API         │  │
                       │  │ (Port 5004)     │  │
                       │  ├─────────────────┤  │
                       │  │ Final Score API │  │
                       │  │ (Port 5005)     │  │
                       │  └─────────────────┘  │
                       └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** (for backend services)
- **Node.js 18+** (for frontend)
- **Docker & Docker Compose** (recommended)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd ecoledger

# Start all services with Docker Compose
docker-compose up -d

# Frontend: http://localhost:3000
# APIs: http://localhost:5001-5006
```

### Option 2: Manual Setup

#### Backend Services
```bash
# Terminal 1: YOLOv8 Tree Detection API
cd backend/yolov8_api
pip install -r requirements.txt
python app.py

# Terminal 2: NDVI Vegetation Health API  
cd backend/ndvi_api
pip install -r requirements.txt
python app.py

# Terminal 3: IoT Environmental Data API
cd backend/iot_api
pip install -r requirements.txt
python app.py

# Terminal 4: CO₂ Absorption Calculator API
cd backend/co2_api
pip install -r requirements.txt
python app.py

# Terminal 5: Final Score & Carbon Credits API
cd backend/finalscore_api
pip install -r requirements.txt
python app.py

# Terminal 6: Blockchain Ledger Service
cd backend/ledger_service
pip install -r requirements.txt
python app.py
```

#### Frontend
```bash
# Terminal 7: Frontend Application
npm install
npm run dev
```

## 🧪 Testing with Postman

1. **Import Collection**: Load `postman_collection/EcoLedger_APIs.postman_collection.json`
2. **Run Health Checks**: Test all 6 API endpoints are running
3. **End-to-End Test**: Use the "Complete End-to-End Workflow" folder
4. **Demo Data**: Each API has `/demo` endpoints with sample data

### Sample API Endpoints

| Service | Port | Health Check | Demo Endpoint |
|---------|------|--------------|---------------|
| YOLOv8 Tree Detection | 5001 | `/health` | `/demo` |
| NDVI Vegetation Health | 5002 | `/health` | `/demo` |  
| IoT Environmental Data | 5003 | `/health` | `/demo` |
| CO₂ Absorption Calculator | 5004 | `/health` | `/demo` |
| Final Score Calculator | 5005 | `/health` | `/demo` |
| Blockchain Ledger | 5006 | `/health` | `/ledger/blockchain` |

## 📊 AI Models & Scoring

### Tree Detection (YOLOv8)
- **Input**: Drone/satellite images
- **Output**: Tree count, bounding boxes, confidence scores
- **Demo Mode**: Uses vegetation analysis for realistic tree counts

### NDVI Analysis
- **Input**: Multispectral imagery
- **Output**: Vegetation health score (0-1), NDVI map visualization
- **Formula**: `(NIR - RED) / (NIR + RED)`

### IoT Environmental Scoring
- **Parameters**: Soil moisture, temperature, salinity, pH, dissolved oxygen
- **Optimal Ranges**: Configured for mangrove growth conditions
- **Scoring**: 1.0 (optimal), 0.5 (marginal), 0.0 (unsuitable)

### Final Score Formula
```
AI_Tree_Score = Trees_Detected / Trees_Claimed
Final_Score = 0.4×AI_Tree_Score + 0.3×NDVI_Score + 0.2×IoT_Score + 0.1×Audit_Check
Carbon_Credits = (CO₂_Absorbed / 1000) × Final_Score
```

### Grading System
- **A+ (90-100%)**: Premium Quality
- **A (80-89%)**: High Quality  
- **B+ (70-79%)**: Good Quality
- **B (60-69%)**: Satisfactory
- **C (50-59%)**: Marginal
- **D (<50%)**: Below Standard

## 🏪 Carbon Credit Marketplace

### For NGOs
- Upload project data (images, coordinates, sensor data)
- Real-time AI verification pipeline
- Earn carbon credits based on verified results
- Track project status and blockchain records

### For Companies
- Browse verified carbon credit projects
- Filter by quality score, location, price
- Purchase credits with blockchain transfer
- Track portfolio and environmental impact

### Market Features
- **Quality Assurance**: AI-verified projects only
- **Transparent Pricing**: Market rates with quality premiums
- **Instant Transfers**: Blockchain-based ownership
- **Impact Tracking**: CO₂ equivalents and environmental metrics

## 🔗 Blockchain Simulation

### Features
- **Immutable Records**: SHA-256 hashed blocks with verification data
- **Smart Transactions**: Credit issuance and transfers
- **Query System**: Search by project ID, NGO, or transaction hash
- **RESTful API**: Standard HTTP endpoints for all operations

### Endpoints
```bash
POST /ledger/submit      # Submit verification report
GET  /ledger/query       # Query verification records  
POST /ledger/issue       # Issue carbon credits
POST /ledger/transfer    # Transfer credits between entities
GET  /ledger/credits     # List available credits
GET  /ledger/blockchain  # Get blockchain statistics
```

## 🎯 Demo Scenarios

### Scenario 1: Successful High-Quality Project
- **Trees**: 45 detected / 50 claimed (90% accuracy)
- **NDVI**: 0.742 (healthy vegetation)
- **IoT**: 0.658 (good environmental conditions)
- **Final Score**: 0.756 (B+ Grade)
- **Carbon Credits**: 0.418 tons

### Scenario 2: Premium Project
- **Trees**: 48 detected / 50 claimed (96% accuracy)  
- **NDVI**: 0.891 (excellent vegetation)
- **IoT**: 0.823 (optimal conditions)
- **Final Score**: 0.912 (A+ Grade)
- **Carbon Credits**: 0.508 tons

## 🛠️ Development

### Project Structure
```
ecoledger/
├── backend/
│   ├── yolov8_api/        # Tree detection service
│   ├── ndvi_api/          # Vegetation health service
│   ├── iot_api/           # Environmental data service
│   ├── co2_api/           # CO₂ calculation service
│   ├── finalscore_api/    # Final scoring service
│   └── ledger_service/    # Blockchain simulation
├── src/                   # Frontend React/Next.js app
├── postman_collection/    # API testing collection
├── sample_data/          # Demo data and examples
└── docker-compose.yml    # Container orchestration
```

### Adding New Features
1. **New AI Model**: Add to `backend/` with Flask app structure
2. **Frontend Pages**: Add to `src/pages/` with React components
3. **API Integration**: Update API configuration and axios calls
4. **Blockchain Logic**: Extend ledger service endpoints

### Configuration
- **API Ports**: Modify in `docker-compose.yml` or individual apps
- **Scoring Weights**: Update in `finalscore_api/app.py`
- **Market Rates**: Configure in finalscore and ledger services
- **Frontend API URLs**: Update in dashboard components

## 🔧 Troubleshooting

### Common Issues
1. **Port Conflicts**: Change ports in docker-compose.yml or individual apps
2. **CORS Errors**: Flask apps include CORS headers, check frontend API URLs
3. **File Uploads**: Ensure uploads/ directories exist for image processing
4. **Database**: SQLite DB created automatically in ledger service

### Performance
- **YOLOv8**: Uses nano model for speed, upgrade to full model for accuracy
- **Image Processing**: Implements file size limits and format validation
- **Database**: SQLite for demo, upgrade to PostgreSQL for production
- **Caching**: Add Redis for API response caching in production

## 📈 Scaling for Production

### Infrastructure
- **Load Balancer**: Distribute traffic across API instances
- **Container Orchestration**: Kubernetes for auto-scaling
- **Database**: PostgreSQL with connection pooling
- **File Storage**: AWS S3 or similar for image uploads
- **Monitoring**: Prometheus + Grafana for metrics

### Security
- **Authentication**: JWT tokens for API access
- **HTTPS**: SSL certificates for all endpoints  
- **Input Validation**: Enhanced validation for all user inputs
- **Rate Limiting**: Protect APIs from abuse
- **Blockchain**: Integrate real Hyperledger Fabric network

### AI Models
- **YOLOv8**: Fine-tune with mangrove-specific dataset
- **NDVI**: Use true multispectral satellite imagery
- **IoT**: Real sensor integration with MQTT/LoRaWAN
- **ML Pipeline**: MLflow for model versioning and deployment

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for frontend components
- Add tests for new AI models
- Update Postman collection for new endpoints
- Document API changes in README

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌍 Environmental Impact

EcoLedger supports UN Sustainable Development Goals:
- **SDG 13**: Climate Action through carbon credit verification
- **SDG 14**: Life Below Water via mangrove ecosystem restoration  
- **SDG 15**: Life on Land through coastal habitat protection

**Join us in building a transparent, trustworthy carbon credit marketplace for a sustainable future! 🌱**

---

For questions, issues, or hackathon support, please open an issue or contact the development team.