'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  TreePine, 
  Satellite, 
  Database, 
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { EcoLedgerAPI, handleApiError } from '@/lib/api'
import type { ProjectUploadData, VerificationProgress } from '@/types'

export default function UploadPage() {
  const [formData, setFormData] = useState<ProjectUploadData>({
    ngoId: '',
    projectId: '',
    projectName: '',
    claimedTrees: 0,
    auditCheck: 0.8,
    treeImage: null,
    ndviImage: null,
    iotData: null,
  })

  const [progress, setProgress] = useState<VerificationProgress>({
    step: 0,
    totalSteps: 6,
    currentTask: '',
    completed: false,
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState<{ type: string; file: File } | null>(null)

  // File dropzones
  const createDropzone = (fileType: keyof Pick<ProjectUploadData, 'treeImage' | 'ndviImage' | 'iotData'>, acceptedTypes: { [key: string]: string[] }) => {
    return useDropzone({
      accept: acceptedTypes,
      maxFiles: 1,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          setFormData(prev => ({ ...prev, [fileType]: acceptedFiles[0] }))
          toast.success(`${fileType === 'treeImage' ? 'Tree image' : fileType === 'ndviImage' ? 'NDVI image' : 'IoT data'} uploaded successfully`)
        }
      },
      onDropRejected: () => {
        toast.error('File type not supported')
      }
    })
  }

  const treeImageDropzone = createDropzone('treeImage', {
    'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']
  })

  const ndviImageDropzone = createDropzone('ndviImage', {
    'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.tif']
  })

  const iotDataDropzone = createDropzone('iotData', {
    'text/csv': ['.csv'],
    'application/json': ['.json']
  })

  const updateProgress = (step: number, task: string) => {
    setProgress(prev => ({
      ...prev,
      step,
      currentTask: task
    }))
  }

  const generateSyntheticIoTData = async () => {
    try {
      const result = await EcoLedgerAPI.generateSyntheticIoTData(100, 30)
      
      // Create a CSV file from the synthetic data
      const csvContent = [
        'timestamp,soil_moisture,temperature,salinity,ph,dissolved_oxygen',
        ...result.synthetic_data.map((row: any) => 
          `${row.timestamp},${row.soil_moisture},${row.temperature},${row.salinity},${row.ph},${row.dissolved_oxygen}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], 'synthetic_iot_data.csv', { type: 'text/csv' })
      
      setFormData(prev => ({ ...prev, iotData: file }))
      toast.success('Synthetic IoT data generated and loaded')
    } catch (error) {
      toast.error(`Failed to generate synthetic IoT data: ${handleApiError(error)}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.ngoId || !formData.projectId || !formData.projectName || formData.claimedTrees <= 0) {
      toast.error('Please fill in all required project information')
      return
    }

    if (!formData.treeImage) {
      toast.error('Please upload a tree detection image')
      return
    }

    setIsProcessing(true)
    setProgress({
      step: 0,
      totalSteps: 6,
      currentTask: 'Starting verification process...',
      completed: false,
      results: {}
    })

    try {
      // Step 1: Tree Detection
      updateProgress(1, 'Detecting trees with YOLOv8...')
      const treeResult = await EcoLedgerAPI.detectTrees(formData.treeImage)
      
      setProgress(prev => ({
        ...prev,
        results: { ...prev.results, treeDetection: treeResult }
      }))

      // Step 2: NDVI Analysis (if image provided, otherwise simulate)
      updateProgress(2, 'Analyzing vegetation health with NDVI...')
      let ndviResult
      if (formData.ndviImage) {
        ndviResult = await EcoLedgerAPI.calculateNDVI(formData.ndviImage)
      } else {
        // Use tree image for NDVI simulation
        ndviResult = await EcoLedgerAPI.calculateNDVI(formData.treeImage)
      }

      setProgress(prev => ({
        ...prev,
        results: { ...prev.results, ndvi: ndviResult }
      }))

      // Step 3: IoT Analysis (if data provided, otherwise use synthetic)
      updateProgress(3, 'Processing IoT sensor data...')
      let iotResult
      if (formData.iotData) {
        iotResult = await EcoLedgerAPI.processIoTData(formData.iotData, formData.iotData.name.endsWith('.csv'))
      } else {
        // Generate and process synthetic IoT data
        const syntheticData = await EcoLedgerAPI.generateSyntheticIoTData(50, 15)
        iotResult = await EcoLedgerAPI.processIoTData(syntheticData.synthetic_data)
      }

      setProgress(prev => ({
        ...prev,
        results: { ...prev.results, iot: iotResult }
      }))

      // Step 4: CO₂ Calculation
      updateProgress(4, 'Calculating CO₂ absorption...')
      const co2Result = await EcoLedgerAPI.calculateSimpleCO2(treeResult.Tree_Count)

      setProgress(prev => ({
        ...prev,
        results: { ...prev.results, co2: co2Result }
      }))

      // Step 5: Final Score Calculation
      updateProgress(5, 'Computing final verification score...')
      const finalScoreData = {
        Tree_Count: treeResult.Tree_Count,
        Claimed_Trees: formData.claimedTrees,
        NDVI_Score: ndviResult.NDVI_Score,
        IoT_Score: iotResult.IoT_Score,
        Audit_Check: formData.auditCheck
      }

      const finalScoreResult = await EcoLedgerAPI.calculateFinalScore(finalScoreData)

      setProgress(prev => ({
        ...prev,
        results: { ...prev.results, finalScore: finalScoreResult }
      }))

      // Step 6: Blockchain Submission
      updateProgress(6, 'Submitting to blockchain ledger...')
      const blockchainResult = await EcoLedgerAPI.submitVerificationReport(
        formData.ngoId,
        formData.projectId,
        {
          project_name: formData.projectName,
          tree_detection: treeResult,
          ndvi_analysis: ndviResult,
          iot_analysis: iotResult,
          co2_calculation: co2Result,
          final_score_calculation: finalScoreResult
        }
      )

      setProgress(prev => ({
        ...prev,
        results: { ...prev.results, blockchain: blockchainResult },
        completed: true,
        currentTask: 'Verification completed successfully!'
      }))

      // Issue carbon credits if eligible
      if (finalScoreResult.Verification_Status.credits_eligible && finalScoreResult.Carbon_Credits > 0) {
        await EcoLedgerAPI.issueCredits(
          formData.ngoId,
          blockchainResult.report_id,
          finalScoreResult.Carbon_Credits,
          25.0 // $25 per credit
        )
        toast.success(`${finalScoreResult.Carbon_Credits.toFixed(3)} carbon credits issued!`)
      }

      toast.success('Verification process completed successfully!')

    } catch (error) {
      const errorMessage = handleApiError(error)
      setProgress(prev => ({
        ...prev,
        error: errorMessage,
        currentTask: `Error: ${errorMessage}`
      }))
      toast.error(`Verification failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const FileDropzoneArea = ({ 
    dropzone, 
    file, 
    title, 
    description, 
    icon: Icon 
  }: {
    dropzone: any
    file: File | null
    title: string
    description: string
    icon: any
  }) => (
    <div
      {...dropzone.getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dropzone.isDragActive
          ? 'border-primary-500 bg-primary-50'
          : file
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...dropzone.getInputProps()} />
      <Icon className={`mx-auto h-12 w-12 ${file ? 'text-green-500' : 'text-gray-400'}`} />
      <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
      {file && (
        <div className="mt-2">
          <p className="text-sm font-medium text-green-600">✓ {file.name}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowPreview({ type: title, file })
            }}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Eye className="inline w-3 h-3 mr-1" />
            Preview
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload & Verify Mangrove Project</h2>
          <p className="text-gray-600">
            Submit your mangrove plantation data for AI-powered verification and carbon credit issuance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NGO ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.ngoId}
                onChange={(e) => setFormData(prev => ({ ...prev, ngoId: e.target.value }))}
                placeholder="e.g., NGO_MANGROVE_001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                placeholder="e.g., PROJ_2024_001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g., Sundarbans Restoration Project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claimed Trees <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                className="input-field"
                value={formData.claimedTrees || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, claimedTrees: parseInt(e.target.value) || 0 }))}
                placeholder="e.g., 1000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Check Score (0-1)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="flex-1"
                  value={formData.auditCheck}
                  onChange={(e) => setFormData(prev => ({ ...prev, auditCheck: parseFloat(e.target.value) }))}
                />
                <span className="text-sm font-medium text-gray-600 w-16">
                  {formData.auditCheck.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Manual audit verification score (0.8 = 80% verified through manual inspection)
              </p>
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tree Detection Image <span className="text-red-500">*</span>
              </label>
              <FileDropzoneArea
                dropzone={treeImageDropzone}
                file={formData.treeImage}
                title="Drone/Satellite Image"
                description="Upload image for tree counting"
                icon={TreePine}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NDVI Image (Optional)
              </label>
              <FileDropzoneArea
                dropzone={ndviImageDropzone}
                file={formData.ndviImage}
                title="Multispectral Image"
                description="For vegetation health analysis"
                icon={Satellite}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IoT Sensor Data (Optional)
              </label>
              <FileDropzoneArea
                dropzone={iotDataDropzone}
                file={formData.iotData}
                title="CSV/JSON Data"
                description="Soil, temperature, salinity data"
                icon={Database}
              />
              <button
                type="button"
                onClick={generateSyntheticIoTData}
                className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800"
              >
                Generate Synthetic IoT Data
              </button>
            </div>
          </div>

          {/* Progress Display */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Loader2 className="animate-spin h-4 w-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Processing Verification</span>
              </div>
              
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.step / progress.totalSteps) * 100}%` }}
                />
              </div>
              
              <p className="text-sm text-blue-700">
                Step {progress.step} of {progress.totalSteps}: {progress.currentTask}
              </p>
              
              {progress.error && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  {progress.error}
                </div>
              )}
            </div>
          )}

          {/* Success Display */}
          {progress.completed && progress.results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Verification Completed Successfully!</span>
              </div>
              
              {progress.results.finalScore && (
                <div className="text-sm text-green-700 space-y-1">
                  <p>Final Score: {(progress.results.finalScore.Final_Score * 100).toFixed(1)}%</p>
                  <p>Trees Detected: {progress.results.treeDetection?.Tree_Count}</p>
                  <p>Carbon Credits: {progress.results.finalScore.Carbon_Credits.toFixed(3)}</p>
                  <p>Status: {progress.results.finalScore.Verification_Status.status}</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProcessing}
              className={`btn-primary flex items-center space-x-2 ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Start Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* File Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">{showPreview.type} Preview</h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {showPreview.file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(showPreview.file)}
                  alt="Preview"
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-16 w-16 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    File: {showPreview.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Size: {(showPreview.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}