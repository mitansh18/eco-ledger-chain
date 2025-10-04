// Tree Detection Types
export interface TreeDetectionResult {
  Tree_Count: number
  Boxes: TreeBoundingBox[]
  Image_Size: {
    width: number
    height: number
  }
  Detection_Method: string
  timestamp: string
  filename: string
  status: string
}

export interface TreeBoundingBox {
  label: string
  confidence: number
  x1: number
  y1: number
  x2: number
  y2: number
}

// NDVI Types
export interface NDVIResult {
  NDVI_Score: number
  Mean_NDVI: number
  NDVI_Stats: NDVIStats
  NDVI_Map_URL: string | null
  Image_Size: {
    width: number
    height: number
  }
  Calculation_Method: string
  Health_Classification: string
  timestamp: string
  status: string
}

export interface NDVIStats {
  min: number
  max: number
  mean: number
  median: number
  std: number
  percentile_25: number
  percentile_75: number
  healthy_vegetation_percentage: number
  degraded_vegetation_percentage: number
}

// IoT Types
export interface IoTResult {
  IoT_Score: number
  Parameter_Scores: { [key: string]: ParameterScore }
  Data_Summary: DataSummary
  Insights: string[]
  Trends: { [key: string]: TrendInfo }
  Health_Status: string
  Recommendations: string[]
  timestamp: string
  status: string
}

export interface ParameterScore {
  score: number
  status: string
  mean_value: number
  min_value?: number
  max_value?: number
  readings_count: number
  unit: string
  optimal_range: string
}

export interface DataSummary {
  total_readings: number
  parameters_available: string[]
  date_range?: {
    start: string
    end: string
    duration_days: number
  }
  measurement_frequency?: string
}

export interface TrendInfo {
  direction: string
  slope: number
  recent_value: number
  change_from_start: number
}

// CO2 Types
export interface CO2Result {
  CO2_absorbed_kg: number
  CO2_absorbed_tonnes?: number
  Carbon_Credits_Potential?: number
  Base_Calculation?: {
    tree_count: number
    co2_per_tree_kg_year: number
    time_period_years: number
    base_absorption_kg: number
  }
  Applied_Factors?: any
  Environmental_Impact?: any
  timestamp: string
  status: string
}

// Final Score Types
export interface FinalScoreRequest {
  Tree_Count: number
  Claimed_Trees: number
  NDVI_Score: number
  IoT_Score: number
  Audit_Check: number
  additional_metrics?: any
}

export interface FinalScoreResult {
  Final_Score: number
  Carbon_Credits: number
  CO2_absorbed_kg: number
  CO2_absorbed_tonnes: number
  Individual_Scores: {
    AI_Tree_Score: number
    NDVI_Score: number
    IoT_Score: number
    Audit_Check: number
  }
  Score_Weights: { [key: string]: number }
  Input_Data: {
    Tree_Count: number
    Claimed_Trees: number
    Tree_Detection_Accuracy: number
  }
  Verification_Status: VerificationStatus
  Compliance_Check: ComplianceCheck
  Risk_Assessment: RiskAssessment
  Report_ID: string
  Timestamp: string
  status: string
}

export interface VerificationStatus {
  status: string
  level: string
  credits_eligible: boolean
  confidence: number
  quality_grade: string
}

export interface ComplianceCheck {
  compliant: boolean
  issues: string[]
  warnings: string[]
  recommendations: string[]
}

export interface RiskAssessment {
  overall_risk_level: string
  risks: RiskFactor[]
  risk_score: number
  mitigation_required: boolean
}

export interface RiskFactor {
  type: string
  severity: string
  description: string
}

// Blockchain Types
export interface VerificationReport {
  report_id: string
  ngo_id: string
  project_id: string
  verification_data: any
  data_hash: string
  final_score: number
  carbon_credits: number
  transaction_id: string
  block_number: number
  block_hash: string
  status: string
  created_at: string
}

export interface CarbonCredit {
  credit_id: string
  ngo_id: string
  company_id?: string
  amount: number
  price_per_credit?: number
  total_value?: number
  report_id: string
  status: string
  issued_at: string
  transferred_at?: string
  project_id?: string
  final_score?: number
}

export interface BlockchainTransaction {
  transaction_id: string
  block_number: number
  transaction_type: string
  from_org?: string
  to_org?: string
  data: any
  data_hash: string
  timestamp: string
  status: string
}

// Form Types
export interface ProjectUploadData {
  ngoId: string
  projectId: string
  projectName: string
  claimedTrees: number
  auditCheck: number
  treeImage: File | null
  ndviImage: File | null
  iotData: File | null
}

export interface VerificationProgress {
  step: number
  totalSteps: number
  currentTask: string
  completed: boolean
  error?: string
  results?: {
    treeDetection?: TreeDetectionResult
    ndvi?: NDVIResult
    iot?: IoTResult
    co2?: CO2Result
    finalScore?: FinalScoreResult
    blockchain?: any
  }
}

// API Response Types
export interface ApiResponse<T> {
  status: string
  data?: T
  error?: string
  message?: string
}

// Service Health Types
export interface ServiceHealth {
  service: string
  status: string
  data?: any
  error?: string
}