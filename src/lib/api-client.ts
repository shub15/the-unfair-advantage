import { BusinessIdea, EvaluationResult, FileUploadData } from '../types/index'

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

  async uploadFile(data: FileUploadData): Promise<{ success: boolean; url: string; extractedText?: string }> {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('type', data.type)

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }

  async evaluateIdea(idea: BusinessIdea): Promise<EvaluationResult> {
    const response = await fetch(`${this.baseUrl}/api/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(idea),
    })

    if (!response.ok) {
      throw new Error('Evaluation failed')
    }

    return response.json()
  }

  async transcribeAudio(audioBlob: Blob): Promise<{ text: string; language: string; confidence: number }> {
    const formData = new FormData()
    formData.append('audio', audioBlob)

    const response = await fetch(`${this.baseUrl}/api/transcribe`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Transcription failed')
    }

    return response.json()
  }

  async getEvaluationResult(id: string): Promise<EvaluationResult> {
    const response = await fetch(`${this.baseUrl}/api/results/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch result')
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
