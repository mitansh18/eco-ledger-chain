'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Award, 
  TreePine, 
  Leaf, 
  DollarSign,
  Filter,
  Search,
  Star,
  MapPin,
  Calendar,
  TrendingUp,
  Shield,
  CheckCircle,
  Info,
  Eye,
  Heart
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { EcoLedgerAPI, handleApiError } from '@/lib/api'
import type { CarbonCredit } from '@/types'

// Mock marketplace data - in production, this would come from the blockchain API
const mockCarbonCredits = [
  {
    credit_id: 'cc_001',
    ngo_id: 'NGO_MANGROVE_001',
    ngo_name: 'Sundarbans Conservation Society',
    project_id: 'PROJ_2024_001',
    project_name: 'Sundarbans Restoration Project',
    amount: 12.45,
    price_per_credit: 25.0,
    total_value: 311.25,
    final_score: 0.87,
    verification_level: 'AA',
    location: 'West Bengal, India',
    project_area: '150 hectares',
    trees_planted: 1024,
    co2_absorbed: 12569,
    status: 'available',
    issued_at: '2024-01-15T10:30:00Z',
    description: 'High-quality mangrove restoration in the Sundarbans delta with excellent biodiversity outcomes.',
    certifications: ['Gold Standard', 'VCS Verified', 'UN SDG Aligned'],
    images: ['/api/placeholder/400/300'],
    impact_metrics: {
      biodiversity_score: 0.92,
      community_impact: 0.88,
      carbon_permanence: 0.85,
      additional_benefits: ['Coastal protection', 'Fish habitat', 'Storm surge reduction']
    }
  },
  {
    credit_id: 'cc_002', 
    ngo_id: 'NGO_COASTAL_002',
    ngo_name: 'Kerala Coastal Restoration Foundation',
    project_id: 'PROJ_2024_002',
    project_name: 'Kerala Backwaters Mangrove Project',
    amount: 8.96,
    price_per_credit: 22.0,
    total_value: 197.12,
    final_score: 0.72,
    verification_level: 'A',
    location: 'Kerala, India',
    project_area: '95 hectares',
    trees_planted: 756,
    co2_absorbed: 9287,
    status: 'available',
    issued_at: '2024-01-12T14:20:00Z',
    description: 'Community-based mangrove restoration supporting local livelihoods in Kerala backwaters.',
    certifications: ['VCS Verified', 'Community Certified'],
    images: ['/api/placeholder/400/300'],
    impact_metrics: {
      biodiversity_score: 0.78,
      community_impact: 0.95,
      carbon_permanence: 0.75,
      additional_benefits: ['Tourism development', 'Aquaculture support', 'Water quality improvement']
    }
  },
  {
    credit_id: 'cc_003',
    ngo_id: 'NGO_MANGROVE_003', 
    ngo_name: 'Mumbai Coastal Protection Alliance',
    project_id: 'PROJ_2024_003',
    project_name: 'Mumbai Urban Mangrove Initiative',
    amount: 15.32,
    price_per_credit: 30.0,
    total_value: 459.60,
    final_score: 0.91,
    verification_level: 'AAA',
    location: 'Maharashtra, India',
    project_area: '200 hectares',
    trees_planted: 1456,
    co2_absorbed: 17893,
    status: 'available',
    issued_at: '2024-01-08T09:15:00Z',
    description: 'Premium urban mangrove restoration with cutting-edge monitoring and community engagement.',
    certifications: ['Gold Standard', 'VCS Verified', 'Climate Bond Certified', 'UN SDG Aligned'],
    images: ['/api/placeholder/400/300'],
    impact_metrics: {
      biodiversity_score: 0.95,
      community_impact: 0.89,
      carbon_permanence: 0.93,
      additional_benefits: ['Air quality improvement', 'Urban cooling', 'Flood protection', 'Educational programs']
    }
  },
  {
    credit_id: 'cc_004',
    ngo_id: 'NGO_CONSERVATION_004',
    ngo_name: 'Andaman Mangrove Trust',
    project_id: 'PROJ_2024_004', 
    project_name: 'Andaman Islands Restoration',
    amount: 6.78,
    price_per_credit: 35.0,
    total_value: 237.30,
    final_score: 0.84,
    verification_level: 'AA',
    location: 'Andaman Islands, India',
    project_area: '75 hectares',
    trees_planted: 623,
    co2_absorbed: 7653,
    status: 'available',
    issued_at: '2024-01-05T16:45:00Z',
    description: 'Island ecosystem restoration focusing on rare mangrove species and marine biodiversity.',
    certifications: ['VCS Verified', 'Marine Stewardship Certified'],
    images: ['/api/placeholder/400/300'],
    impact_metrics: {
      biodiversity_score: 0.98,
      community_impact: 0.82,
      carbon_permanence: 0.88,
      additional_benefits: ['Marine sanctuary', 'Coral reef protection', 'Indigenous community support']
    }
  }
]

export default function Marketplace() {
  const [credits, setCredits] = useState<any[]>([])
  const [selectedCredit, setSelectedCredit] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [sortBy, setSortBy] = useState('price_asc')
  const [cart, setCart] = useState<{[key: string]: number}>({})
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMarketplaceData()
  }, [])

  const loadMarketplaceData = async () => {
    try {
      setIsLoading(true)
      // In production, fetch from blockchain API
      // const availableCredits = await EcoLedgerAPI.getAvailableCredits()
      
      // For now, use mock data
      setCredits(mockCarbonCredits)
    } catch (error) {
      toast.error(`Failed to load marketplace data: ${handleApiError(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort credits
  const filteredCredits = credits
    .filter(credit => {
      const matchesSearch = 
        credit.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.ngo_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.location.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPrice = priceFilter === 'all' || 
        (priceFilter === 'under_25' && credit.price_per_credit < 25) ||
        (priceFilter === '25_35' && credit.price_per_credit >= 25 && credit.price_per_credit <= 35) ||
        (priceFilter === 'over_35' && credit.price_per_credit > 35)
      
      const matchesLocation = locationFilter === 'all' || 
        credit.location.toLowerCase().includes(locationFilter.toLowerCase())
      
      return matchesSearch && matchesPrice && matchesLocation
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price_per_credit - b.price_per_credit
        case 'price_desc':
          return b.price_per_credit - a.price_per_credit
        case 'score_desc':
          return b.final_score - a.final_score
        case 'amount_desc':
          return b.amount - a.amount
        case 'newest':
          return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
        default:
          return 0
      }
    })

  const addToCart = (creditId: string, amount: number) => {
    setCart(prev => ({ ...prev, [creditId]: amount }))
    toast.success(`Added ${amount} credits to cart`)
  }

  const getTotalCartValue = () => {
    return Object.entries(cart).reduce((total, [creditId, amount]) => {
      const credit = credits.find(c => c.credit_id === creditId)
      return total + (credit ? credit.price_per_credit * amount : 0)
    }, 0)
  }

  const purchaseCredits = async (credit: any, amount: number) => {
    try {
      if (!companyId) {
        toast.error('Please enter your company ID')
        return
      }

      const result = await EcoLedgerAPI.transferCredits(
        credit.credit_id,
        credit.ngo_id,
        companyId,
        amount
      )

      toast.success(`Successfully purchased ${amount} carbon credits!`)
      setShowPurchaseModal(false)
      setPurchaseAmount('')
      
      // Refresh marketplace data
      loadMarketplaceData()
      
    } catch (error) {
      toast.error(`Purchase failed: ${handleApiError(error)}`)
    }
  }

  const CreditCard = ({ credit }: { credit: any }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="absolute top-4 right-4">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            credit.verification_level === 'AAA' ? 'bg-yellow-100 text-yellow-800' :
            credit.verification_level === 'AA' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {credit.verification_level} Verified
          </div>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center space-x-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(credit.final_score * 5) ? 'fill-current' : 'opacity-30'
                }`}
              />
            ))}
            <span className="text-sm ml-1">{(credit.final_score * 100).toFixed(0)}%</span>
          </div>
          <h3 className="text-lg font-bold truncate">{credit.project_name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{credit.ngo_name}</span>
          <button className="text-gray-400 hover:text-red-500">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {credit.location}
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {credit.description}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">{credit.amount}</div>
            <div className="text-gray-600">Credits Available</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">{credit.trees_planted.toLocaleString()}</div>
            <div className="text-gray-600">Trees Planted</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">{(credit.co2_absorbed / 1000).toFixed(1)}t</div>
            <div className="text-gray-600">CO₂ Absorbed</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">{credit.project_area}</div>
            <div className="text-gray-600">Area Restored</div>
          </div>
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap gap-1 mb-4">
          {credit.certifications.slice(0, 2).map((cert: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {cert}
            </span>
          ))}
          {credit.certifications.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{credit.certifications.length - 2} more
            </span>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary-600">
              ${credit.price_per_credit}
            </div>
            <div className="text-sm text-gray-600">per credit</div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCredit(credit)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedCredit(credit)
                setShowPurchaseModal(true)
              }}
              className="btn-primary text-sm px-4 py-2"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carbon Credits Marketplace</h2>
          <p className="text-gray-600">Purchase verified carbon credits from mangrove restoration projects</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
            <ShoppingCart className="w-4 h-4" />
            <span>{Object.keys(cart).length} items</span>
          </div>
          <div className="text-sm font-medium">
            Total: ${getTotalCartValue().toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="under_25">Under $25</option>
            <option value="25_35">$25 - $35</option>
            <option value="over_35">Over $35</option>
          </select>

          <select
            className="input-field"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            <option value="west bengal">West Bengal</option>
            <option value="kerala">Kerala</option>
            <option value="maharashtra">Maharashtra</option>
            <option value="andaman">Andaman</option>
          </select>

          <select
            className="input-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="score_desc">Highest Score</option>
            <option value="amount_desc">Most Credits</option>
            <option value="newest">Newest</option>
          </select>

          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-600">
              {filteredCredits.length} projects found
            </span>
          </div>
        </div>
      </div>

      {/* Credits Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading marketplace...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredits.map((credit) => (
            <CreditCard key={credit.credit_id} credit={credit} />
          ))}
        </div>
      )}

      {/* Credit Detail Modal */}
      {selectedCredit && !showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{selectedCredit.project_name}</h3>
              <button
                onClick={() => setSelectedCredit(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium mb-4">Project Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Organization</label>
                      <p className="text-lg">{selectedCredit.ngo_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-lg">{selectedCredit.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification Score</label>
                      <p className="text-lg">{(selectedCredit.final_score * 100).toFixed(1)}% ({selectedCredit.verification_level})</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Available Credits</label>
                      <p className="text-lg">{selectedCredit.amount} credits</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-4">Impact Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Biodiversity Score</span>
                      <span className="font-medium">{(selectedCredit.impact_metrics.biodiversity_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community Impact</span>
                      <span className="font-medium">{(selectedCredit.impact_metrics.community_impact * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbon Permanence</span>
                      <span className="font-medium">{(selectedCredit.impact_metrics.carbon_permanence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Benefits */}
              <div>
                <h4 className="text-lg font-medium mb-3">Additional Environmental Benefits</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCredit.impact_metrics.additional_benefits.map((benefit: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="text-lg font-medium mb-3">Certifications & Standards</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCredit.certifications.map((cert: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Shield className="inline w-3 h-3 mr-1" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Purchase Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-primary-600">
                      ${selectedCredit.price_per_credit}
                    </div>
                    <div className="text-gray-600">per carbon credit</div>
                  </div>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    Purchase Credits
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Purchase Carbon Credits</h3>
              <button
                onClick={() => {
                  setShowPurchaseModal(false)
                  setPurchaseAmount('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Project</label>
                <p className="text-lg font-medium">{selectedCredit.project_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="e.g., COMPANY_ABC_123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Credits
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={selectedCredit.amount}
                  step="0.1"
                  className="input-field"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder={`Max: ${selectedCredit.amount}`}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {selectedCredit.amount} credits
                </p>
              </div>

              {purchaseAmount && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Credits:</span>
                    <span>{purchaseAmount}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Price per credit:</span>
                    <span>${selectedCredit.price_per_credit}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${(parseFloat(purchaseAmount) * selectedCredit.price_per_credit).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPurchaseModal(false)
                    setPurchaseAmount('')
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => purchaseCredits(selectedCredit, parseFloat(purchaseAmount))}
                  disabled={!companyId || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}