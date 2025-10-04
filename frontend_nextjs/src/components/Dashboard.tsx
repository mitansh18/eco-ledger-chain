'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  TreePine, 
  Leaf, 
  Database, 
  Award, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { EcoLedgerAPI, handleApiError } from '@/lib/api'
import type { VerificationReport, ServiceHealth } from '@/types'

// Mock data for demonstration - in production, this would come from the blockchain API
const mockVerificationReports = [
  {
    report_id: 'rpt_001',
    ngo_id: 'NGO_MANGROVE_001',
    project_id: 'PROJ_2024_001',
    project_name: 'Sundarbans Restoration',
    final_score: 0.87,
    carbon_credits: 12.45,
    verification_data: {
      tree_detection: { Tree_Count: 1024, Detection_Method: 'YOLOv8' },
      ndvi_analysis: { NDVI_Score: 0.82, Health_Classification: 'Good' },
      iot_analysis: { IoT_Score: 0.75, Health_Status: 'Good' },
      final_score_calculation: {
        Individual_Scores: {
          AI_Tree_Score: 0.89,
          NDVI_Score: 0.82,
          IoT_Score: 0.75,
          Audit_Check: 0.90
        },
        Verification_Status: { status: 'Very Good', level: 'AA', credits_eligible: true }
      }
    },
    status: 'verified',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    report_id: 'rpt_002',
    ngo_id: 'NGO_COASTAL_002',
    project_id: 'PROJ_2024_002',
    project_name: 'Kerala Backwaters Project',
    final_score: 0.72,
    carbon_credits: 8.96,
    verification_data: {
      tree_detection: { Tree_Count: 756, Detection_Method: 'YOLOv8' },
      ndvi_analysis: { NDVI_Score: 0.68, Health_Classification: 'Fair' },
      iot_analysis: { IoT_Score: 0.61, Health_Status: 'Fair' },
      final_score_calculation: {
        Individual_Scores: {
          AI_Tree_Score: 0.76,
          NDVI_Score: 0.68,
          IoT_Score: 0.61,
          Audit_Check: 0.85
        },
        Verification_Status: { status: 'Good', level: 'A', credits_eligible: true }
      }
    },
    status: 'verified',
    created_at: '2024-01-12T14:20:00Z'
  },
  {
    report_id: 'rpt_003',
    ngo_id: 'NGO_MANGROVE_001',
    project_id: 'PROJ_2024_003',
    project_name: 'Mumbai Coastal Protection',
    final_score: 0.54,
    carbon_credits: 4.23,
    verification_data: {
      tree_detection: { Tree_Count: 412, Detection_Method: 'YOLOv8' },
      ndvi_analysis: { NDVI_Score: 0.45, Health_Classification: 'Poor' },
      iot_analysis: { IoT_Score: 0.38, Health_Status: 'Poor' },
      final_score_calculation: {
        Individual_Scores: {
          AI_Tree_Score: 0.55,
          NDVI_Score: 0.45,
          IoT_Score: 0.38,
          Audit_Check: 0.75
        },
        Verification_Status: { status: 'Marginal', level: 'C', credits_eligible: false }
      }
    },
    status: 'verified',
    created_at: '2024-01-10T09:15:00Z'
  }
]

export default function Dashboard() {
  const [reports, setReports] = useState<VerificationReport[]>([])
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([])
  const [selectedReport, setSelectedReport] = useState<VerificationReport | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    checkServiceHealth()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      // In production, fetch from blockchain API
      // const blockchainStats = await EcoLedgerAPI.getBlockchainStats()
      
      // For now, use mock data
      setReports(mockVerificationReports as any)
    } catch (error) {
      toast.error(`Failed to load dashboard data: ${handleApiError(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkServiceHealth = async () => {
    try {
      const healthResults = await EcoLedgerAPI.checkAllServices()
      setServiceHealth(healthResults)
    } catch (error) {
      console.error('Failed to check service health:', error)
    }
  }

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.ngo_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.project_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  // Calculate summary statistics
  const stats = {
    totalReports: reports.length,
    totalCredits: reports.reduce((sum, r) => sum + r.carbon_credits, 0),
    avgScore: reports.length > 0 ? reports.reduce((sum, r) => sum + r.final_score, 0) / reports.length : 0,
    eligibleCredits: reports.filter(r => r.verification_data.final_score_calculation.Verification_Status.credits_eligible).length
  }

  // Chart data
  const scoreDistribution = [
    { range: '0.9-1.0', count: reports.filter(r => r.final_score >= 0.9).length, color: '#22c55e' },
    { range: '0.8-0.9', count: reports.filter(r => r.final_score >= 0.8 && r.final_score < 0.9).length, color: '#84cc16' },
    { range: '0.7-0.8', count: reports.filter(r => r.final_score >= 0.7 && r.final_score < 0.8).length, color: '#eab308' },
    { range: '0.6-0.7', count: reports.filter(r => r.final_score >= 0.6 && r.final_score < 0.7).length, color: '#f97316' },
    { range: '<0.6', count: reports.filter(r => r.final_score < 0.6).length, color: '#ef4444' }
  ]

  const timeSeriesData = reports
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(report => ({
      date: new Date(report.created_at).toLocaleDateString(),
      score: report.final_score * 100,
      credits: report.carbon_credits,
      trees: report.verification_data.tree_detection.Tree_Count
    }))

  const ScoreCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  )

  const ServiceStatusIndicator = ({ service }: { service: ServiceHealth }) => (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
      {service.status === 'healthy' ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-red-500" />
      )}
      <span className="text-sm font-medium">{service.service}</span>
      <span className={`text-xs px-2 py-1 rounded ${
        service.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {service.status}
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verification Dashboard</h2>
          <p className="text-gray-600">Monitor mangrove verification results and carbon credit issuance</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={checkServiceHealth}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Service Health Status */}
      {serviceHealth.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Health Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {serviceHealth.map((service, index) => (
              <ServiceStatusIndicator key={index} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Total Reports"
          value={stats.totalReports}
          subtitle="Verification reports"
          icon={Database}
          color="#3b82f6"
        />
        <ScoreCard
          title="Carbon Credits"
          value={stats.totalCredits.toFixed(2)}
          subtitle="Total credits issued"
          icon={Award}
          color="#22c55e"
        />
        <ScoreCard
          title="Average Score"
          value={`${(stats.avgScore * 100).toFixed(1)}%`}
          subtitle="Verification accuracy"
          icon={TrendingUp}
          color="#8b5cf6"
        />
        <ScoreCard
          title="Eligible Projects"
          value={`${stats.eligibleCredits}/${stats.totalReports}`}
          subtitle="Credit eligible"
          icon={CheckCircle}
          color="#f59e0b"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time Series */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Score %" />
              <Line type="monotone" dataKey="credits" stroke="#22c55e" name="Credits" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Verification Reports</h3>
            
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 input-field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NGO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.project_name || 'Unnamed Project'}
                        </div>
                        <div className="text-sm text-gray-500">{report.project_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.ngo_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {(report.final_score * 100).toFixed(1)}%
                        </div>
                        <div className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          report.final_score >= 0.8 ? 'bg-green-100 text-green-800' :
                          report.final_score >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.verification_data.final_score_calculation.Verification_Status.level}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.carbon_credits.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.verification_data.tree_detection.Tree_Count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.status === 'verified' ? 'bg-green-100 text-green-800' :
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Verification Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Name</label>
                  <p className="text-lg font-medium">{selectedReport.project_name || 'Unnamed Project'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NGO ID</label>
                  <p className="text-lg font-medium">{selectedReport.ngo_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Final Score</label>
                  <p className="text-lg font-medium">{(selectedReport.final_score * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Carbon Credits</label>
                  <p className="text-lg font-medium">{selectedReport.carbon_credits.toFixed(3)}</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="text-lg font-medium mb-4">Score Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedReport.verification_data.final_score_calculation.Individual_Scores).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{key.replace('_', ' ')}</p>
                      <p className="text-xl font-bold text-gray-900">{((value as number) * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TreePine className="w-5 h-5 text-blue-600" />
                    <h5 className="font-medium">Tree Detection</h5>
                  </div>
                  <p className="text-sm text-gray-600">
                    Trees Detected: {selectedReport.verification_data.tree_detection.Tree_Count}
                  </p>
                  <p className="text-sm text-gray-600">
                    Method: {selectedReport.verification_data.tree_detection.Detection_Method}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <h5 className="font-medium">Vegetation Health</h5>
                  </div>
                  <p className="text-sm text-gray-600">
                    NDVI Score: {(selectedReport.verification_data.ndvi_analysis.NDVI_Score * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Classification: {selectedReport.verification_data.ndvi_analysis.Health_Classification}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <h5 className="font-medium">Environmental Conditions</h5>
                  </div>
                  <p className="text-sm text-gray-600">
                    IoT Score: {(selectedReport.verification_data.iot_analysis.IoT_Score * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {selectedReport.verification_data.iot_analysis.Health_Status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}