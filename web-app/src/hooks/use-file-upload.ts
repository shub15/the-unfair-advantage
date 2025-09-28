'use client'

import { useState, useCallback } from 'react'
import { FileUploadData } from '@/types'
import { apiClient } from '@/lib/api-client'

interface UseFileUploadReturn {
  uploadFile: (data: FileUploadData) => Promise<{ success: boolean; url: string; extractedText?: string }>
  isUploading: boolean
  progress: number
  error: string | null
  reset: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (data: FileUploadData) => {
    try {
      setIsUploading(true)
      setProgress(0)
      setError(null)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await apiClient.uploadFile(data)

      clearInterval(progressInterval)
      setProgress(100)

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 1000) // Reset progress after delay
    }
  }, [])

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset
  }
}
