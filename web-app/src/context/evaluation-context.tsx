'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { BusinessIdea, EvaluationResult } from '@/types'

interface EvaluationState {
  currentIdea: BusinessIdea | null
  evaluationResult: EvaluationResult | null
  isEvaluating: boolean
  error: string | null
  history: EvaluationResult[]
}

type EvaluationAction =
  | { type: 'SET_IDEA'; payload: BusinessIdea }
  | { type: 'START_EVALUATION' }
  | { type: 'SET_RESULT'; payload: EvaluationResult }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TO_HISTORY'; payload: EvaluationResult }
  | { type: 'RESET' }

const initialState: EvaluationState = {
  currentIdea: null,
  evaluationResult: null,
  isEvaluating: false,
  error: null,
  history: []
}

function evaluationReducer(state: EvaluationState, action: EvaluationAction): EvaluationState {
  switch (action.type) {
    case 'SET_IDEA':
      return {
        ...state,
        currentIdea: action.payload,
        evaluationResult: null,
        error: null
      }
    
    case 'START_EVALUATION':
      return {
        ...state,
        isEvaluating: true,
        error: null
      }
    
    case 'SET_RESULT':
      return {
        ...state,
        evaluationResult: action.payload,
        isEvaluating: false,
        error: null
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isEvaluating: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        history: [action.payload, ...state.history]
      }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

interface EvaluationContextType {
  state: EvaluationState
  setIdea: (idea: BusinessIdea) => void
  startEvaluation: () => void
  setResult: (result: EvaluationResult) => void
  setError: (error: string) => void
  clearError: () => void
  addToHistory: (result: EvaluationResult) => void
  reset: () => void
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined)

interface EvaluationProviderProps {
  children: ReactNode
}

export function EvaluationProvider({ children }: EvaluationProviderProps) {
  const [state, dispatch] = useReducer(evaluationReducer, initialState)

  const contextValue: EvaluationContextType = {
    state,
    setIdea: (idea: BusinessIdea) => dispatch({ type: 'SET_IDEA', payload: idea }),
    startEvaluation: () => dispatch({ type: 'START_EVALUATION' }),
    setResult: (result: EvaluationResult) => dispatch({ type: 'SET_RESULT', payload: result }),
    setError: (error: string) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    addToHistory: (result: EvaluationResult) => dispatch({ type: 'ADD_TO_HISTORY', payload: result }),
    reset: () => dispatch({ type: 'RESET' })
  }

  return (
    <EvaluationContext.Provider value={contextValue}>
      {children}
    </EvaluationContext.Provider>
  )
}

export function useEvaluation() {
  const context = useContext(EvaluationContext)
  if (context === undefined) {
    throw new Error('useEvaluation must be used within an EvaluationProvider')
  }
  return context
}
