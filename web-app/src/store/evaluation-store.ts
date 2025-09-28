import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { EvaluationResponse } from '@/lib/api-client'

// Define the shape of your state and the actions to modify it
interface EvaluationState {
  evaluationResult: EvaluationResponse | null;
  setEvaluationResult: (result: EvaluationResponse) => void;
  clearEvaluationResult: () => void;
}

// Create the store with persistence middleware
// This will automatically save the state to sessionStorage and rehydrate it on page loads
export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set) => ({
      evaluationResult: null,
      setEvaluationResult: (result) => set({ evaluationResult: result }),
      clearEvaluationResult: () => set({ evaluationResult: null }),
    }),
    {
      name: 'evaluation-result-storage', // A unique name for the browser's storage
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage to persist the data
    }
  )
);