'use client'

import { useState, useCallback } from 'react'
import { BusinessIdea, EvaluationResult } from '@/types'
import { apiClient } from '@/lib/api-client'
import { useEvaluation as useEvaluationContext } from '@/context/evaluation-context'

interface UseEvaluationReturn {
  evaluateIdea: (idea: BusinessIdea) => Promise<EvaluationResult>
  isEvaluating: boolean
  error: string | null
  progress: number
  reset: () => void
}

export function useEvaluation(): UseEvaluationReturn {
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { setResult, addToHistory } = useEvaluationContext()

  const evaluateIdea = useCallback(async (idea: BusinessIdea): Promise<EvaluationResult> => {
    try {
      setIsEvaluating(true)
      setError(null)
      setProgress(0)

      // Simulate evaluation progress
      const stages = [
        'Analyzing market viability...',
        'Evaluating financial feasibility...',
        'Assessing execution readiness...',
        'Calculating innovation index...',
        'Determining scalability potential...',
        'Generating recommendations...'
      ]

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90))
      }, 500)

      const result = await apiClient.evaluateIdea(idea)

      clearInterval(progressInterval)
      setProgress(100)

      // Update context
      setResult(result)
      addToHistory(result)

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Evaluation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsEvaluating(false)
      setTimeout(() => setProgress(0), 1000) // Reset progress after delay
    }
  }, [setResult, addToHistory])

  const reset = useCallback(() => {
    setIsEvaluating(false)
    setError(null)
    setProgress(0)
  }, [])

  return {
    evaluateIdea,
    isEvaluating,
    error,
    progress,
    reset
  }
}
