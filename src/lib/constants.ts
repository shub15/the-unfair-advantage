import { Language } from '../types/index'

export const SUPPORTED_LANGUAGES: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  gu: 'ગુજરાતી',
  mr: 'मराठी',
  bn: 'বাংলা',
  pa: 'ਪੰਜਾਬੀ'
}

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Agriculture',
  'Finance',
  'Retail',
  'Manufacturing',
  'Transportation',
  'Energy',
  'Food & Beverages',
  'Tourism',
  'Real Estate',
  'Entertainment',
  'Other'
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ACCEPTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain']

export const EVALUATION_DIMENSIONS = [
  {
    key: 'marketViability',
    title: 'Market Viability',
    description: 'Assessment of market demand and competition'
  },
  {
    key: 'financialFeasibility',
    title: 'Financial Feasibility', 
    description: 'Analysis of revenue models and profitability'
  },
  {
    key: 'executionReadiness',
    title: 'Execution Readiness',
    description: 'Evaluation of resources and implementation capability'
  },
  {
    key: 'innovationIndex',
    title: 'Innovation Index',
    description: 'Uniqueness and differentiation factors'
  },
  {
    key: 'scalabilityPotential',
    title: 'Scalability Potential',
    description: 'Growth opportunities and expansion possibilities'
  }
]

export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  EVALUATE: '/api/evaluate', 
  TRANSCRIBE: '/api/transcribe',
  HANDWRITING: '/api/handwriting'
} as const
