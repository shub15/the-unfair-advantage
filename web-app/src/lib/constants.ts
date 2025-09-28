import { SUPPORTED_LANGUAGES, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from './api-client'

// Export from API client for consistency
export { SUPPORTED_LANGUAGES, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES }

// Additional UI constants
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif'
]

export const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain'
]

export const ACCEPTED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'audio/ogg'
]

// Language options for UI
export const LANGUAGE_OPTIONS = Object.entries(SUPPORTED_LANGUAGES).map(
  ([label, value]) => ({ label, value })
)

// Industry options
export const INDUSTRIES = [
  'Technology',
  'Healthcare', 
  'Agriculture',
  'Finance',
  'Education',
  'E-commerce',
  'Food & Beverage',
  'Manufacturing',
  'Transportation',
  'Real Estate',
  'Entertainment',
  'Energy',
  'Other'
]
