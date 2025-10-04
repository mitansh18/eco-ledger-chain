'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Award, 
  TrendingUp,
  AlertTriangle,
  FileText,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PendingVerification {
  verification_id: string
  ngo_id: string
  project_id: string
  project_name: string
  dataset_type: string
  verification_strategy: string
  confidence_score: number
  verification_results: any
  created_at: string
  file_count: number
  total_size_mb: number
}

interface AdminStats {
  status_breakdown: { [key: string]: number }
  total_credits_issued: number
  average_confidence_score: number
  recent_submissions_7days: number
  pending_review_count: number
}

export default function AdminPanel() {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adminId, setAdminId] = useState('ADMIN_001')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [customCredits, setCustomCredits] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setIsLoading(true)
      
      // Load pending verifications
      const pendingResponse = await fetch('http://localhost:5007/admin/pending')
      const pendingData = await pendingResponse.json()
      
      if (pendingData.status === 'success') {
        setPendingVerifications(pendingData.pending_verifications)
      }
      
      // Load admin statistics
      const statsResponse = await fetch('http://localhost:5007/admin/statistics')
      const statsData = await statsResponse.json()
      
      if (statsData.status === 'success') {
        setAdminStats(statsData.statistics)
      }
      
    } catch (error) {
      toast.error(`Failed to load admin data: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproval = async (verificationId: string, approved: boolean) => {
    try {
      const approvalData = {
        verification_id: verificationId,
        admin_id: adminId,
        approved: approved,
        admin_notes: approvalNotes,
        credits_to_issue: customCredits ? parseFloat(customCredits) : null
      }

      const response = await fetch('http://localhost:5007/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      })

      const result = await response.json()
      
      if (result.status === 'success') {
        toast.success(`Verification ${approved ? 'approved' : 'rejected'} successfully`)
        setSelectedVerification(null)
        setApprovalNotes('')
        setCustomCredits('')
        loadAdminData() // Reload data
      } else {
        toast.error(`Approval failed: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Approval failed: ${error}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      case 'pending_admin_review':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredVerifications = pendingVerifications.filter(verification => {
    const matchesSearch = 
      verification.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.ngo_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.verification_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'high_confidence' && verification.confidence_score >= 0.8) ||
      (filter === 'low_confidence' && verification.confidence_score < 0.6)
    
    return matchesSearch && matchesFilter
  })

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-gray-600">Review and approve environmental dataset verifications</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Admin ID:</span>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="Admin ID"
            />
          </div>
          <div className="text-gray-500">
            Current Session: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {adminStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Clock}
            title="Pending Review"
            value={adminStats.pending_review_count}
            subtitle="Awaiting approval"
            color="#f59e0b"
          />
          <StatCard
            icon={CheckCircle}
            title="Approved"
            value={adminStats.status_breakdown.approved || 0}
            subtitle="Verified projects"
            color="#10b981"
          />
          <StatCard
            icon={Award}
            title="Credits Issued"
            value={adminStats.total_credits_issued.toFixed(1)}
            subtitle="Total carbon credits"
            color="#8b5cf6"
          />
          <StatCard
            icon={TrendingUp}
            title="Avg Confidence"
            value={`${(adminStats.average_confidence_score * 100).toFixed(1)}%`}
            subtitle="AI accuracy"
            color="#3b82f6"
          />
          <StatCard
            icon={Calendar}
            title="Recent Submissions"
            value={adminStats.recent_submissions_7days}
            subtitle="Last 7 days"
            color="#06b6d4"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h3 className="text-lg font-medium text-gray-900">Pending Verifications</h3>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search verifications..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Verifications</option>
              <option value="high_confidence">High Confidence (≥80%)</option>
              <option value="low_confidence">Low Confidence (&lt;60%)</option>
            </select>
            
            <button
              onClick={loadAdminData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Pending Verifications Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NGO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dataset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading pending verifications...
                  </td>
                </tr>
              ) : filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No pending verifications found
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((verification) => (
                  <tr key={verification.verification_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {verification.project_name || 'Unnamed Project'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {verification.verification_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.ngo_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {verification.file_count} files
                      </div>
                      <div className="text-sm text-gray-500">
                        {verification.total_size_mb.toFixed(1)} MB
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {verification.dataset_type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getConfidenceColor(verification.confidence_score)}`}>
                        {(verification.confidence_score * 100).toFixed(1)}%
                      </div>
                      {verification.confidence_score >= 0.8 && (
                        <div className="text-xs text-green-600">High Quality</div>
                      )}
                      {verification.confidence_score < 0.6 && (
                        <div className="text-xs text-red-600">Needs Review</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {verification.verification_strategy.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(verification.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedVerification(verification)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Review Verification</h3>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Project Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Project:</strong> {selectedVerification.project_name}</div>
                    <div><strong>NGO:</strong> {selectedVerification.ngo_id}</div>
                    <div><strong>Project ID:</strong> {selectedVerification.project_id}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedVerification.created_at).toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dataset Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Files:</strong> {selectedVerification.file_count}</div>
                    <div><strong>Size:</strong> {selectedVerification.total_size_mb.toFixed(1)} MB</div>
                    <div><strong>Type:</strong> {selectedVerification.dataset_type}</div>
                    <div><strong>Strategy:</strong> {selectedVerification.verification_strategy}</div>
                  </div>
                </div>
              </div>

              {/* AI Verification Results */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI Verification Results</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Confidence Score:</span>
                      <div className={`text-xl font-bold ${getConfidenceColor(selectedVerification.confidence_score)}`}>
                        {(selectedVerification.confidence_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Verification Type:</span>
                      <div className="text-lg font-medium">
                        {selectedVerification.verification_results.verification_type}
                      </div>
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  {Object.keys(selectedVerification.verification_results.metrics).length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Verification Metrics</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedVerification.verification_results.metrics).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                            {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Issues and Recommendations */}
              {selectedVerification.verification_results.issues?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Issues Identified</span>
                  </h4>
                  <ul className="space-y-1">
                    {selectedVerification.verification_results.issues.map((issue: string, index: number) => (
                      <li key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedVerification.verification_results.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Recommendations</h4>
                  <ul className="space-y-1">
                    {selectedVerification.verification_results.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Admin Decision Form */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Admin Decision</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Add review notes..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Carbon Credits (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Leave blank for AI-calculated amount"
                      value={customCredits}
                      onChange={(e) => setCustomCredits(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApproval(selectedVerification.verification_id, true)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve & Issue Credits</span>
                    </button>
                    
                    <button
                      onClick={() => handleApproval(selectedVerification.verification_id, false)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}