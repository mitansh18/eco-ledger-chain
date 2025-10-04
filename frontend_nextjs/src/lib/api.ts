import axios from 'axios'

// API Base URLs - adjust for your deployment
const API_URLS = {
  TREE_DETECTION: process.env.NEXT_PUBLIC_TREE_API_URL || 'http://localhost:5001',
  NDVI: process.env.NEXT_PUBLIC_NDVI_API_URL || 'http://localhost:5002',
  IOT: process.env.NEXT_PUBLIC_IOT_API_URL || 'http://localhost:5003',
  CO2: process.env.NEXT_PUBLIC_CO2_API_URL || 'http://localhost:5004',
  FINAL_SCORE: process.env.NEXT_PUBLIC_FINAL_SCORE_API_URL || 'http://localhost:5005',
  BLOCKCHAIN: process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || 'http://localhost:5006',
}

// Create axios instances for each service
const createApiClient = (baseURL: string) => {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const treeDetectionApi = createApiClient(API_URLS.TREE_DETECTION)
export const ndviApi = createApiClient(API_URLS.NDVI)
export const iotApi = createApiClient(API_URLS.IOT)
export const co2Api = createApiClient(API_URLS.CO2)
export const finalScoreApi = createApiClient(API_URLS.FINAL_SCORE)
export const blockchainApi = createApiClient(API_URLS.BLOCKCHAIN)

// API Service Class
export class EcoLedgerAPI {
  // Tree Detection API
  static async detectTrees(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const response = await treeDetectionApi.post('/treecount', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  // NDVI API
  static async calculateNDVI(imageFile: File, isMultispectral: boolean = false) {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('multispectral', isMultispectral.toString())
    
    const response = await ndviApi.post('/ndvi', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  // IoT API
  static async processIoTData(data: any, isCSV: boolean = false) {
    if (isCSV) {
      const formData = new FormData()
      formData.append('file', data)
      
      const response = await iotApi.post('/iot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      const response = await iotApi.post('/iot', data)
      return response.data
    }
  }

  // Generate synthetic IoT data for testing
  static async generateSyntheticIoTData(readings: number = 100, days: number = 30) {
    const response = await iotApi.get(`/iot/synthetic?readings=${readings}&days=${days}`)
    return response.data
  }

  // CO2 API
  static async calculateCO2(treeCount: number, additionalParams?: any) {
    const payload = { Tree_Count: treeCount, ...additionalParams }
    const response = await co2Api.post('/co2', payload)
    return response.data
  }

  // Simple CO2 calculation
  static async calculateSimpleCO2(treeCount: number) {
    const response = await co2Api.post('/co2/simple', { Tree_Count: treeCount })
    return response.data
  }

  // Final Score API
  static async calculateFinalScore(data: {
    Tree_Count: number
    Claimed_Trees: number
    NDVI_Score: number
    IoT_Score: number
    Audit_Check: number
    additional_metrics?: any
  }) {
    const response = await finalScoreApi.post('/finalscore', data)
    return response.data
  }

  // Blockchain API
  static async submitVerificationReport(ngoId: string, projectId: string, verificationData: any) {
    const payload = {
      ngo_id: ngoId,
      project_id: projectId,
      verification_data: verificationData,
    }
    const response = await blockchainApi.post('/ledger/submit', payload)
    return response.data
  }

  static async queryReport(reportId: string) {
    const response = await blockchainApi.get(`/ledger/query/${reportId}`)
    return response.data
  }

  static async issueCredits(ngoId: string, reportId: string, amount: number, pricePerCredit?: number) {
    const payload = {
      ngo_id: ngoId,
      report_id: reportId,
      amount,
      price_per_credit: pricePerCredit,
    }
    const response = await blockchainApi.post('/ledger/issue', payload)
    return response.data
  }

  static async transferCredits(creditId: string, fromNgo: string, toCompany: string, amount?: number) {
    const payload = {
      credit_id: creditId,
      from_ngo: fromNgo,
      to_company: toCompany,
      amount,
    }
    const response = await blockchainApi.post('/ledger/transfer', payload)
    return response.data
  }

  static async getAvailableCredits() {
    const response = await blockchainApi.get('/ledger/credits/available')
    return response.data
  }

  static async getBlockchainStats() {
    const response = await blockchainApi.get('/ledger/stats')
    return response.data
  }

  // Health checks
  static async checkAllServices() {
    const services = [
      { name: 'Tree Detection', api: treeDetectionApi },
      { name: 'NDVI', api: ndviApi },
      { name: 'IoT', api: iotApi },
      { name: 'CO2', api: co2Api },
      { name: 'Final Score', api: finalScoreApi },
      { name: 'Blockchain', api: blockchainApi },
    ]

    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await service.api.get('/health')
          return {
            name: service.name,
            status: 'healthy',
            data: response.data,
          }
        } catch (error) {
          return {
            name: service.name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    return results.map((result, index) => ({
      service: services[index].name,
      ...((result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }) as any),
    }))
  }
}

// Error handling utility
export const handleApiError = (error: any) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  } else if (error.message) {
    return error.message
  } else {
    return 'An unexpected error occurred'
  }
}