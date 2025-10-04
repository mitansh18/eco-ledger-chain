# 🌿 EcoLedger - AI-Powered Dynamic Carbon Credit Verification Platform

**EcoLedger** is a revolutionary, hackathon-ready web application that can intelligently handle **ANY environmental dataset** and automatically verify it using appropriate AI strategies. Built with **dynamic dataset processing**, **intelligent strategy selection**, and **flexible verification algorithms**, it supports everything from mangrove plantations to biodiversity monitoring.

![EcoLedger Architecture](https://img.shields.io/badge/Tech_Stack-Flask%20%7C%20Next.js%20%7C%20AI%20%7C%20Blockchain-blue)
![Status](https://img.shields.io/badge/Status-Hackathon_Ready-green)
![Dynamic](https://img.shields.io/badge/Dataset_Support-Universal-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Revolutionary Features

### 🤖 Universal AI-Powered Verification
- **Dynamic Dataset Detection**: Automatically identifies dataset type from uploaded files
- **Intelligent Strategy Selection**: Chooses optimal verification method based on content analysis
- **Multi-Format Support**: Handles images, CSV, Excel, JSON, GeoJSON, ZIP archives, and more
- **Adaptive Processing**: Adjusts verification algorithms based on available data quality

### 🧠 Smart Verification Strategies
- **Tree Counting & Forest Analysis**: Automated detection from any image type
- **Vegetation Health Assessment**: NDVI and health analysis from multispectral or RGB data  
- **Environmental Monitoring**: IoT sensor data processing and environmental scoring
- **Carbon Sequestration Analysis**: Dynamic carbon estimation from various data sources
- **Biodiversity Assessment**: Species and habitat analysis from mixed datasets
- **Soil & Water Quality**: Chemical and physical parameter analysis
- **Climate Impact Analysis**: Climate resilience and adaptation scoring

### 📊 Dynamic Scoring System
- **Content-Based Weighting**: Automatically adjusts score weights based on available data
- **Confidence Scoring**: Provides reliability metrics for each verification
- **Risk Assessment**: Identifies potential issues and data quality concerns
- **Flexible Thresholds**: Adapts credit eligibility based on dataset type and completeness

### 🔗 Blockchain Integration
- **Hyperledger Fabric Simulation**: Immutable storage of verification reports
- **Carbon Credit Issuance**: Automated credit generation based on verification scores
- **Marketplace Trading**: Companies can purchase verified carbon credits from NGOs

### 🎨 Modern Frontend
- **Next.js + React + TypeScript**: Modern, responsive web interface
- **Tailwind CSS**: Beautiful, accessible UI components
- **Real-time Dashboard**: Visualization of verification results and blockchain stats
- **File Upload Interface**: Drag-and-drop for images and sensor data

## 🏗️ Architecture

```
EcoLedger Dynamic Platform
├── Backend APIs (Flask + Python)
│   ├── Dynamic Dataset API (Port 5007) - Universal dataset processing & strategy selection
│   ├── Tree Detection API (Port 5001) - YOLOv8 simulation
│   ├── NDVI API (Port 5002) - Vegetation health analysis
│   ├── IoT API (Port 5003) - Environmental sensor data processing
│   ├── CO₂ API (Port 5004) - Carbon absorption calculation
│   ├── Final Score API (Port 5005) - Weighted verification scoring
│   └── Blockchain API (Port 5006) - Hyperledger Fabric simulation
├── Frontend (Next.js + React)
│   ├── Smart Dataset Upload - Universal file upload with intelligent analysis
│   ├── Standard Upload - Traditional mangrove project submission
│   ├── Dashboard - Verification results and analytics
│   └── Marketplace - Carbon credit trading
└── Intelligence Layer
    ├── Content analysis and file type detection
    ├── Verification strategy recommendation engine
    ├── Dynamic scoring and confidence calculation
    └── Automated workflow orchestration
```

## 🔧 Technology Stack

### Backend
- **Python 3.9** with Flask web framework
- **YOLOv8** (Ultralytics) for object detection simulation
- **OpenCV + Matplotlib** for image processing
- **Pandas + NumPy** for data analysis
- **SQLite** for blockchain simulation database

### Frontend  
- **Next.js 14** with React 18
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Recharts** for data visualization
- **React Hook Form** for form handling

### DevOps
- **Docker** containerization
- **Docker Compose** for multi-service orchestration
- **Postman** collection for API testing

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** installed
- **Node.js 18+** (for local development)
- **Python 3.9+** (for local development)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecoledger
```

2. **Start all services**
```bash
docker-compose up --build
```

3. **Access the application**
- **Frontend**: http://localhost:3000
- **API Documentation**: See individual service health endpoints

### Option 2: Local Development

1. **Setup Backend Services**
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start each API service in separate terminals
python ai_apis/tree_detection_api.py      # Port 5001
python ai_apis/ndvi_api.py                # Port 5002  
python ai_apis/iot_api.py                 # Port 5003
python ai_apis/co2_api.py                 # Port 5004
python ai_apis/final_score_api.py         # Port 5005
python ledger_service/blockchain_api.py   # Port 5006
```

2. **Setup Frontend**
```bash
# Install Node.js dependencies
cd frontend_nextjs
npm install

# Start development server
npm run dev                               # Port 3000
```

3. **Generate Test Data**
```bash
cd test_data
python generate_test_data.py
```

## 📋 API Endpoints

### Dynamic Dataset Processing APIs

| Service | Endpoint | Method | Description |
|---------|----------|---------|-------------|
| Dataset Analysis | `/dataset/analyze` | POST | Analyze uploaded files and recommend strategy |
| Dataset Verification | `/dataset/verify` | POST | Process dataset with NGO info for admin review |
| Verification Strategies | `/dataset/strategies` | GET | Get available verification strategies |
| Verification History | `/dataset/history` | GET | Get verification history |
| Verification Result | `/dataset/result/{id}` | GET | Get detailed verification result |

### Admin Approval APIs

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/admin/pending` | GET | Get verifications pending admin review |
| `/admin/approve` | POST | Approve or reject verification (issues credits) |
| `/admin/statistics` | GET | Get admin dashboard statistics |

### Core Verification APIs

| Service | Endpoint | Method | Description |
|---------|----------|---------|-------------|
| Tree Detection | `/treecount` | POST | Upload image for tree counting |
| NDVI | `/ndvi` | POST | Upload image for vegetation analysis |
| IoT | `/iot` | POST | Submit sensor data (JSON/CSV) |
| CO₂ | `/co2/simple` | POST | Calculate CO₂ absorption |
| Final Score | `/finalscore` | POST | Compute final verification score |

### Blockchain APIs

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/ledger/submit` | POST | Submit verification report |
| `/ledger/query/{id}` | GET | Query verification report |
| `/ledger/issue` | POST | Issue carbon credits |
| `/ledger/transfer` | POST | Transfer credits to company |
| `/ledger/credits/available` | GET | Get available credits |
| `/ledger/stats` | GET | Get blockchain statistics |

### Health Checks
All services provide `/health` endpoints for monitoring.

## 🧪 Testing with Postman

1. **Import the collection**
```bash
# Import the file: postman/EcoLedger_API_Collection.postman_collection.json
```

2. **Run the complete verification flow**
   - The collection includes automated tests for the entire workflow
   - Variables are automatically set between requests
   - Includes synthetic data generation

3. **Test individual APIs**
   - Each API has dedicated test cases
   - Health checks for all services
   - Error handling validation

## 📊 Verification Formula

The platform uses a weighted scoring system:

```
AI_Tree_Score = Tree_Count / Claimed_Trees
Final_Score = 0.4×AI_Tree_Score + 0.3×NDVI_Score + 0.2×IoT_Score + 0.1×Audit_Check
Carbon_Credits = (CO2_absorbed / 1000) × Final_Score

Where:
- CO2_absorbed = Tree_Count × 12.3 kg (annual absorption per tree)
- All scores are normalized to 0-1 range
- Minimum Final_Score of 0.6 required for carbon credit eligibility
```

## 🎯 Complete Verification Workflow

### 🔄 **Full Admin Approval Process**

**EcoLedger follows a comprehensive 6-step verification workflow:**

#### **Step 1: NGO Data Upload** 🌱
- NGO uploads any environmental dataset (images, CSV, JSON, etc.)
- Provides NGO ID, project information, and project details
- System accepts any file format and automatically analyzes content

#### **Step 2: AI Verification** 🤖
- AI intelligently detects dataset type and selects optimal verification strategy
- Runs appropriate models: tree detection, NDVI analysis, IoT processing, etc.
- Calculates confidence scores and identifies potential issues
- Status: `pending_admin_review`

#### **Step 3: Admin Review & Approval** 👨‍💼
- Admin receives verification in pending queue with AI analysis
- Reviews confidence scores, metrics, and potential issues
- Can approve, reject, or adjust carbon credit amounts
- Adds admin notes and approval decision

#### **Step 4: Carbon Credits Issuance** 💰
- Upon approval, carbon credits automatically issued to NGO
- Credits stored immutably on blockchain ledger
- NGO receives notification of successful credit issuance
- Status: `approved` 

#### **Step 5: Dashboard Visibility** 📊
- Verified projects appear in public verification dashboard
- Shows transparency data: scores, metrics, blockchain hashes
- Real-time statistics and verification trends
- Companies can view project details and verification quality

#### **Step 6: Marketplace Trading** 🛒
- Approved carbon credits become available in marketplace
- Companies can browse, filter, and purchase verified credits
- Blockchain automatically handles credit transfer transactions
- NGOs receive payment for environmental impact

---

### 🧠 Dynamic Dataset Verification (Universal)

1. **Upload Any Environmental Dataset**
   - Drag and drop files: images, CSV, Excel, JSON, GeoJSON, ZIP archives
   - Provide NGO ID and project information
   - System automatically analyzes file content and structure

2. **Intelligent Strategy Selection**
   - AI analyzes filenames, content, and data patterns
   - Recommends optimal verification strategy automatically
   - Supports override with manual strategy selection
   - Confidence scoring for strategy recommendation

3. **Adaptive Verification Process**
   - Applies appropriate AI models based on detected content
   - Dynamically weights scoring based on available data quality
   - Generates verification metrics relevant to dataset type
   - Provides confidence scores and quality assessments

4. **Admin Review Process**
   - All verifications require admin approval before credit issuance
   - Admin reviews AI confidence, metrics, and potential issues
   - Can approve, reject, or modify credit amounts
   - Ensures quality control and fraud prevention

5. **Credit Issuance & Trading**
   - Upon approval, credits automatically issued and recorded on blockchain
   - Credits become available for company purchase in marketplace
   - Full traceability from initial verification to final transaction

### 🌱 Traditional Mangrove Verification (Structured)

1. **Upload Project Data**
   - Project information (NGO ID, project name, claimed trees)
   - Drone/satellite images for tree detection
   - NDVI images (optional) or use RGB estimation
   - IoT sensor data (CSV/JSON) or generate synthetic data

2. **AI Verification Process**
   - YOLOv8 detects and counts trees in uploaded images
   - NDVI analysis assesses vegetation health
   - IoT data processed for environmental conditions
   - CO₂ absorption calculated based on tree count

3. **Score Calculation**
   - Weighted final score computed from all metrics
   - Risk assessment and compliance checking
   - Verification report generated with detailed breakdown

4. **Blockchain Submission**
   - Report submitted to blockchain with immutable hash
   - Carbon credits issued if verification passes thresholds
   - Credits become available in marketplace

### For Companies (Credit Purchase)

1. **Browse Marketplace**
   - Filter projects by location, price, verification score
   - View detailed project information and impact metrics
   - Check certifications and additional benefits

2. **Purchase Credits**
   - Select desired number of credits
   - Complete blockchain transfer transaction
   - Receive verification of ownership transfer

## 📈 Dashboard Analytics

- **Real-time Verification Statistics**
- **Score Distribution Analysis** 
- **Time Series Trends**
- **Service Health Monitoring**
- **Blockchain Transaction History**
- **Carbon Credit Trading Volume**

## 🔒 Security Features

- **Data Integrity**: SHA-256 hashing of all verification data
- **Blockchain Immutability**: Tamper-proof record storage
- **Input Validation**: Comprehensive API parameter validation
- **Error Handling**: Graceful failure management
- **CORS Protection**: Cross-origin request security

## 🌱 Environmental Impact

EcoLedger supports the verification of mangrove restoration projects that provide:

- **Carbon Sequestration**: 12.3 kg CO₂ absorption per tree annually
- **Coastal Protection**: Storm surge and erosion reduction  
- **Biodiversity Conservation**: Habitat for marine and bird species
- **Community Benefits**: Sustainable livelihoods and eco-tourism
- **Water Quality Improvement**: Natural filtration systems

## 🛠️ Development

### Project Structure
```
ecoledger/
├── backend/
│   ├── ai_apis/           # Flask API services
│   ├── ledger_service/    # Blockchain simulation
│   └── requirements.txt   # Python dependencies
├── frontend_nextjs/       # Next.js application
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── lib/          # API client and utilities
│   │   └── types/        # TypeScript type definitions
│   └── package.json      # Node.js dependencies
├── test_data/            # Sample data and generators
├── postman/              # API testing collection
├── docker-compose.yml    # Multi-service orchestration
└── README.md            # This file
```

### Adding New Features

1. **Backend API**: Add new Flask service in `backend/ai_apis/`
2. **Frontend Component**: Create React component in `frontend_nextjs/src/components/`
3. **API Integration**: Update API client in `frontend_nextjs/src/lib/api.ts`
4. **Types**: Add TypeScript definitions in `frontend_nextjs/src/types/`

## 🔮 Future Enhancements

- **Real YOLOv8 Training**: Custom model training on mangrove datasets
- **Satellite Integration**: Direct API integration with satellite data providers
- **Mobile App**: React Native mobile application for field data collection
- **Smart Contracts**: Full Ethereum/Polygon integration for automated trading
- **ML Pipeline**: Advanced machine learning for fraud detection
- **Multi-language Support**: Internationalization for global deployment

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

- **Documentation**: Check the `/health` endpoints for API documentation
- **Issues**: Open GitHub issues for bug reports or feature requests
- **Email**: [Insert contact email]

---

**🌍 Built with ❤️ for environmental sustainability and climate action.**

*EcoLedger - Verifying nature's carbon capture, one mangrove at a time.* 🌿