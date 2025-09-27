// API Configuration
const API_BASE_URL = 'http://10.10.8.132:5000'

// Supported languages mapping
export const SUPPORTED_LANGUAGES = {
  'English': 'en-IN',
  'Hindi': 'hi-IN',
  'Marathi': 'mr-IN',
  'Gujarati': 'gu-IN',
  'Odia': 'or-IN'
}

// Evaluation criteria weights
export const EVALUATION_CRITERIA = {
  feasibility: 0.25,
  financial_viability: 0.15,
  innovation: 0.2,
  market_potential: 0.25,
  scalability: 0.15
}

// File upload limits
export const MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB
export const SUPPORTED_FILE_TYPES = [
  'gif', 'txt', 'pdf', 'jpg', 'm4a', 'ogg', 
  'png', 'mp3', 'wav', 'jpeg'
]

// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface EvaluationResponse {
  id: string
  overall_score: number
  feasibility: number
  financial_viability: number
  innovation: number
  market_potential: number
  scalability: number
  detailed_report: string
  recommendations: string[]
  strengths: string[]
  weaknesses: string[]
  next_steps: string[]
}

export interface UploadResponse {
  success: boolean
  id: string
  status: 'processing' | 'completed' | 'failed'
  extractedText?: string
  confidence?: number
  detectedLanguage?: string
  message?: string
}

export interface ProcessingStatus {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // Helper method for API calls
  private async apiCall<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      console.log(`API Call: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`)
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Helper for file uploads
  private async uploadFile(
    endpoint: string, 
    file: File, 
    additionalFields: Record<string, string> = {}
  ): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Add additional fields
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type - let browser handle it for FormData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`)
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error(`Upload Error (${endpoint}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // EVALUATION ENDPOINTS
  async getEvaluationCriteria(): Promise<ApiResponse> {
    return this.apiCall('/api/evaluate/criteria')
  }

  async analyzeBusinessIdea(data: {
    title: string
    description: string
    industry: string
    target_market: string
    language?: string
  }): Promise<ApiResponse<EvaluationResponse>> {
    return this.apiCall('/api/evaluate/analyze', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        language: data.language || 'en-IN'
      })
    })
  }

  async getEvaluationReport(id: string): Promise<ApiResponse<EvaluationResponse>> {
    return this.apiCall(`/api/evaluate/report/${id}`)
  }

  // UPLOAD ENDPOINTS
  async uploadImage(file: File, language?: string): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile('/api/upload/image', file, {
      language: language || 'en-IN'
    })
  }

  async uploadDocument(file: File, language?: string): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile('/api/upload/document', file, {
      language: language || 'en-IN'
    })
  }

  async uploadVoice(file: File, language?: string): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile('/api/upload/voice', file, {
      language: language || 'en-IN'
    })
  }

  async submitTextIdea(data: {
    title: string
    description: string
    industry: string
    target_market: string
    language?: string
  }): Promise<ApiResponse<UploadResponse>> {
    return this.apiCall('/api/upload/text', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        language: data.language || 'en-IN'
      })
    })
  }

  async getProcessingStatus(id: string): Promise<ApiResponse<ProcessingStatus>> {
    return this.apiCall(`/api/upload/status/${id}`)
  }

  // FEEDBACK ENDPOINTS
  async submitFeedback(data: {
    evaluation_id: string
    feedback: string
    rating: number
    type: 'general' | 'accuracy' | 'usefulness'
  }): Promise<ApiResponse> {
    return this.apiCall('/api/feedback/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async rateEvaluation(data: {
    evaluation_id: string
    rating: number
    comment?: string
  }): Promise<ApiResponse> {
    return this.apiCall('/api/feedback/rating', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // UTILITY METHODS
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/evaluate/criteria`)
      return response.ok
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  // Poll for processing status
  async pollProcessingStatus(
    id: string, 
    onProgress?: (status: ProcessingStatus) => void,
    maxAttempts: number = 30,
    interval: number = 2000
  ): Promise<ProcessingStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.getProcessingStatus(id)
      
      if (response.success && response.data) {
        const status = response.data
        onProgress?.(status)
        
        if (status.status === 'completed' || status.status === 'failed') {
          return status
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    throw new Error('Processing timeout')
  }
}

export const apiClient = new ApiClient()
