'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  Image, 
  Database, 
  Map,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  FileSearch,
  BarChart3,
  Layers,
  Activity,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { EcoLedgerAPI, handleApiError } from '@/lib/api'

interface FileAnalysis {
  filename: string
  extension: string
  size_mb: number
  mime_type: string
  categories: { [key: string]: number }
  content_indicators: { [key: string]: number }
}

interface DatasetAnalysis {
  dataset_type: string
  files_analysis: FileAnalysis[]
  recommended_strategy: string
  confidence: number
  total_files: number
  total_size_mb: number
  data_categories: string[]
}

interface VerificationResult {
  verification_id: string
  dataset_analysis: DatasetAnalysis
  verification_strategy: string
  verification_results: {
    verification_type: string
    metrics: { [key: string]: any }
    confidence_score: number
    issues: string[]
    recommendations: string[]
  }
  next_steps: {
    can_issue_credits: boolean
    recommended_actions: string[]
  }
}

export default function DynamicUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('')
  const [availableStrategies, setAvailableStrategies] = useState<{ [key: string]: any }>({})
  
  // NGO Information
  const [ngoId, setNgoId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projectName, setProjectName] = useState('')

  // Dynamic file dropzone - accepts any file type
  const dropzone = useDropzone({
    accept: {
      '*/*': [] // Accept all file types
    },
    maxFiles: 20, // Allow multiple files
    maxSize: 100 * 1024 * 1024, // 100MB per file
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles])
      toast.success(`${acceptedFiles.length} files uploaded successfully`)
      
      // Auto-analyze if we have files
      if (acceptedFiles.length > 0) {
        setTimeout(() => analyzeDataset([...uploadedFiles, ...acceptedFiles]), 500)
      }
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        toast.error(`File ${rejection.file.name}: ${rejection.errors[0]?.message}`)
      })
    }
  })

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    
    // Re-analyze if files remain
    if (newFiles.length > 0) {
      analyzeDataset(newFiles)
    } else {
      setAnalysis(null)
      setVerificationResult(null)
    }
  }

  const analyzeDataset = async (files: File[] = uploadedFiles) => {
    if (files.length === 0) return

    try {
      setIsAnalyzing(true)
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      const response = await fetch('http://localhost:5007/dataset/analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      setAnalysis(result.analysis)
      
      // Load available strategies
      const strategiesResponse = await fetch('http://localhost:5007/dataset/strategies')
      const strategiesResult = await strategiesResponse.json()
      setAvailableStrategies(strategiesResult.strategies)
      
      toast.success('Dataset analyzed successfully!')
    } catch (error) {
      toast.error(`Analysis failed: ${handleApiError(error)}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const verifyDataset = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload files first')
      return
    }

    if (!ngoId.trim()) {
      toast.error('Please provide NGO ID')
      return
    }

    try {
      setIsVerifying(true)
      const formData = new FormData()
      uploadedFiles.forEach(file => formData.append('files', file))
      
      // Add NGO information
      formData.append('ngo_id', ngoId.trim())
      if (projectId.trim()) formData.append('project_id', projectId.trim())
      if (projectName.trim()) formData.append('project_name', projectName.trim())
      
      if (selectedStrategy) {
        formData.append('strategy', selectedStrategy)
      }

      const response = await fetch('http://localhost:5007/dataset/verify', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`)
      }

      const result = await response.json()
      setVerificationResult(result)
      
      toast.success('Dataset verification submitted for admin review!')
    } catch (error) {
      toast.error(`Verification failed: ${handleApiError(error)}`)
    } finally {
      setIsVerifying(false)
    }
  }

  const getFileTypeIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop()
    
    if (['jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp', 'gif'].includes(ext || '')) {
      return <Image className="w-6 h-6 text-blue-500" />
    } else if (['csv', 'xlsx', 'xls', 'json', 'parquet'].includes(ext || '')) {
      return <Database className="w-6 h-6 text-green-500" />
    } else if (['geojson', 'kml', 'shp', 'gpx'].includes(ext || '')) {
      return <Map className="w-6 h-6 text-purple-500" />
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Layers className="w-6 h-6 text-orange-500" />
    } else {
      return <FileText className="w-6 h-6 text-gray-500" />
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'tree_counting':
        return <Target className="w-5 h-5 text-green-600" />
      case 'vegetation_health':
        return <Activity className="w-5 h-5 text-emerald-600" />
      case 'environmental_monitoring':
        return <Zap className="w-5 h-5 text-blue-600" />
      case 'carbon_estimation':
        return <TrendingUp className="w-5 h-5 text-purple-600" />
      default:
        return <Brain className="w-5 h-5 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    if (confidence >= 0.4) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-8 h-8 text-primary-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dynamic Dataset Verification</h2>
            <p className="text-gray-600">Upload any environmental dataset for intelligent AI-powered verification</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
            <FileSearch className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Auto-Detection</span>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg">
            <Brain className="w-5 h-5 text-green-600" />
            <span className="font-medium">Smart Analysis</span>
          </div>
          <div className="flex items-center space-x-2 bg-purple-50 p-3 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Dynamic Scoring</span>
          </div>
          <div className="flex items-center space-x-2 bg-orange-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium">Flexible Verification</span>
          </div>
        </div>
      </div>

      {/* NGO Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">NGO Project Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NGO ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={ngoId}
              onChange={(e) => setNgoId(e.target.value)}
              placeholder="e.g., NGO_MANGROVE_001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project ID
            </label>
            <input
              type="text"
              className="input-field"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., PROJ_2024_001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              className="input-field"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Sundarbans Restoration"
            />
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Dataset Files</h3>
        
        <div
          {...dropzone.getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dropzone.isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...dropzone.getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your dataset files here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports: Images, CSV, Excel, JSON, GeoJSON, ZIP archives, and more
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Tree Images</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Sensor Data</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Satellite Images</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Environmental Data</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Carbon Measurements</span>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getFileTypeIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dataset Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-medium text-gray-900">Intelligent Dataset Analysis</h3>
            {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Dataset Type</div>
              <div className="text-xl font-bold text-blue-700 capitalize">
                {analysis.dataset_type.replace('_', ' ')}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-900">Total Size</div>
              <div className="text-xl font-bold text-green-700">
                {analysis.total_size_mb.toFixed(2)} MB
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-900">Confidence</div>
              <div className={`text-xl font-bold ${analysis.confidence >= 0.7 ? 'text-purple-700' : 'text-orange-700'}`}>
                {(analysis.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Recommended Strategy */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg mb-4">
            <div className="flex items-center space-x-2 mb-2">
              {getStrategyIcon(analysis.recommended_strategy)}
              <h4 className="font-medium text-primary-900">Recommended Verification Strategy</h4>
            </div>
            <p className="text-primary-800 capitalize">
              {analysis.recommended_strategy.replace('_', ' ')}
            </p>
            <p className="text-sm text-primary-700 mt-1">
              Based on dataset analysis, this strategy is most suitable for your data
            </p>
          </div>

          {/* Data Categories Found */}
          {analysis.data_categories.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Detected Data Categories</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.data_categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm capitalize"
                  >
                    {category.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strategy Selection */}
          {Object.keys(availableStrategies).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Verification Strategy (Optional)
              </label>
              <select
                className="input-field"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option value="">Use Recommended Strategy</option>
                {Object.entries(availableStrategies).map(([key, strategy]) => (
                  <option key={key} value={key}>
                    {strategy.name}
                  </option>
                ))}
              </select>
              {selectedStrategy && availableStrategies[selectedStrategy] && (
                <p className="text-sm text-gray-600 mt-1">
                  {availableStrategies[selectedStrategy].description}
                </p>
              )}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={verifyDataset}
            disabled={isVerifying}
            className={`btn-primary flex items-center space-x-2 ${
              isVerifying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Verifying Dataset...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Start Intelligent Verification</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Verification Results */}
      {verificationResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Verification Submitted Successfully</h3>
            <span className="text-sm text-gray-500">ID: {verificationResult.verification_id}</span>
          </div>

          {/* Workflow Status */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Current Status: Pending Admin Review</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>✅ NGO uploaded dataset</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>✅ AI verification completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>⏳ Awaiting admin approval</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>⏸️ Carbon credits will be issued upon approval</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>⏸️ Verified data will appear in dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>⏸️ Credits will be available for company trading</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-700">
              <strong>Estimated Processing Time:</strong> {verificationResult.next_steps.estimated_processing_time}
            </div>
          </div>

          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-indigo-900">NGO Information</div>
              <div className="text-lg font-bold text-indigo-700">
                {verificationResult.ngo_id}
              </div>
              {verificationResult.project_name && (
                <div className="text-sm text-indigo-600">{verificationResult.project_name}</div>
              )}
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-900">AI Confidence</div>
              <div className="text-2xl font-bold text-green-700">
                {(verificationResult.verification_results.confidence_score * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-green-600">
                {verificationResult.verification_results.verification_type}
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-900">Potential Credits</div>
              <div className="text-2xl font-bold text-purple-700">
                {verificationResult.potential_carbon_credits}
              </div>
              <div className="text-sm text-purple-600">Subject to admin approval</div>
            </div>
          </div>

          {/* Verification Metrics */}
          {Object.keys(verificationResult.verification_results.metrics).length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">AI Analysis Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(verificationResult.verification_results.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value).slice(0, 100) + '...' : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps for NGO */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">What Happens Next?</h4>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Our admin team will review your submission within 24-48 hours</li>
              <li>• You'll receive an email notification when the review is complete</li>
              <li>• If approved, carbon credits will be automatically issued to your NGO account</li>
              <li>• Credits will become available for trading in the marketplace</li>
              <li>• You can track the status in the Dashboard</li>
            </ul>
          </div>

          {/* Issues and Recommendations */}
          {verificationResult.verification_results.issues?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>Issues for Admin Review</span>
              </h4>
              <ul className="space-y-2">
                {verificationResult.verification_results.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-orange-700 bg-orange-50 p-3 rounded">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verificationResult.verification_results.recommendations?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                <span>AI Recommendations</span>
              </h4>
              <ul className="space-y-2">
                {verificationResult.verification_results.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-blue-700 bg-blue-50 p-3 rounded">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}