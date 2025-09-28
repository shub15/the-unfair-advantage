import { z } from 'zod'
import { 
  INDUSTRIES, 
  MAX_FILE_SIZE, 
  ACCEPTED_AUDIO_TYPES, 
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_DOCUMENT_TYPES 
} from './constants'

export const businessIdeaSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),

  // Fixed: Use simple Zod enum syntax
  industry: z.enum(INDUSTRIES as [string, ...string[]], {
    message: 'Please select a valid industry'
  }),
  
  targetMarket: z.string()
    .min(10, 'Target market description must be at least 10 characters')
    .max(500, 'Target market description must be less than 500 characters'),
  
  language: z.string().optional()
})

// Fixed: Simple enum syntax for file types
export const fileUploadSchema = z.object({
  type: z.enum(['handwriting', 'audio', 'document'], {
    message: 'Please specify a valid file type'
  }),
  file: z.instanceof(File, { message: 'A file is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    })
}).superRefine((data, ctx) => {
  const { file, type } = data
  
  // Validate file MIME type based on the type field
  if (type === 'handwriting' && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid image format. Accepted types: JPG, PNG, GIF, WEBP',
      path: ['file']
    })
  } else if (type === 'audio' && !ACCEPTED_AUDIO_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid audio format. Accepted types: MP3, WAV, M4A, OGG',
      path: ['file']
    })
  } else if (type === 'document' && !ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid document format. Accepted types: PDF, TXT',
      path: ['file']
    })
  }
})

export const audioRecordingSchema = z.object({
  duration: z.number().min(1, 'Recording must be at least 1 second'),
  blob: z.custom<Blob>((blob) => blob instanceof Blob, 'Invalid audio data')
})

// Alternative schemas using string literals instead of enums
export const businessIdeaSchemaAlt = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),

  // Alternative: Use string with refine for more flexibility
  industry: z.string()
    .min(1, 'Please select an industry')
    .refine(
      (value) => INDUSTRIES.includes(value as any), 
      { message: 'Please select a valid industry' }
    ),
  
  targetMarket: z.string()
    .min(10, 'Target market description must be at least 10 characters')
    .max(500, 'Target market description must be less than 500 characters'),
  
  language: z.string().optional()
})

// Simple file validation without enum
export const fileUploadSchemaAlt = z.object({
  type: z.string()
    .refine(
      (value) => ['handwriting', 'audio', 'document'].includes(value),
      { message: 'Please specify a valid file type' }
    ),
  file: z.instanceof(File, { message: 'A file is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    })
}).superRefine((data, ctx) => {
  const { file, type } = data
  
  if (type === 'handwriting' && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid image format. Accepted types: JPG, PNG, GIF, WEBP',
      path: ['file']
    })
  } else if (type === 'audio' && !ACCEPTED_AUDIO_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid audio format. Accepted types: MP3, WAV, M4A, OGG',
      path: ['file']
    })
  } else if (type === 'document' && !ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid document format. Accepted types: PDF, TXT',
      path: ['file']
    })
  }
})

// Text extraction schema
export const ideaTextSchema = z.object({
  text: z.string()
    .min(10, 'Text must be at least 10 characters')
    .max(5000, 'Text must be less than 5000 characters')
})

// Evaluation request schema
export const evaluationRequestSchema = z.object({
  idea: businessIdeaSchema,
  files: z.array(fileUploadSchema).optional(),
  audioRecordings: z.array(audioRecordingSchema).optional()
})

// Type exports
export type BusinessIdeaForm = z.infer<typeof businessIdeaSchema>
export type FileUploadForm = z.infer<typeof fileUploadSchema>
export type AudioRecordingForm = z.infer<typeof audioRecordingSchema>
export type IdeaTextForm = z.infer<typeof ideaTextSchema>
export type EvaluationRequestForm = z.infer<typeof evaluationRequestSchema>

// Alternative type exports
export type BusinessIdeaFormAlt = z.infer<typeof businessIdeaSchemaAlt>
export type FileUploadFormAlt = z.infer<typeof fileUploadSchemaAlt>
