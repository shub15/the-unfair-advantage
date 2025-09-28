import { supabase } from '@/lib/supabase'

// Business Plan JSON Schema Interface
export interface BusinessPlanJSON {
  business_concept: string
  target_market: string
  revenue_model: string
  key_resources: string[]
  startup_costs: {
    amount: number
    currency: string
    breakdown: Array<{ item: string; cost: number }>
  }
  competition_analysis: string
  unique_selling_proposition: string
  market_size?: string
  financial_projections?: {
    year1_revenue: number
    year1_expenses: number
    break_even_months: number
  }
  team_background?: string
  implementation_timeline?: Array<{ phase: string; duration: string; activities: string[] }>
}

export interface ApplicationFile {
  id: string
  evaluation_id: string
  file_type: 'image' | 'voice' | 'document' | 'sketch'
  file_name: string
  file_url: string
  processing_results?: any
  extracted_text?: string
  confidence_score?: number
  upload_status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface AIProcessingJob {
  id: string
  evaluation_id: string
  job_type: 'ocr' | 'image_analysis' | 'voice_transcription' | 'plan_extraction' | 'scoring'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying'
  input_data?: any
  output_data?: any
  error_message?: string
  processing_time_ms?: number
}

export class TataStriveAPIService {
  // File Upload and Processing
  async uploadApplicationFile(
    evaluationId: string, 
    file: File, 
    fileType: 'image' | 'voice' | 'document' | 'sketch'
  ): Promise<ApplicationFile> {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `applications/${evaluationId}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('application-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('application-files')
        .getPublicUrl(filePath)

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('application_files')
        .insert({
          evaluation_id: evaluationId,
          file_type: fileType,
          file_name: file.name,
          file_size: file.size,
          file_url: publicUrl,
          mime_type: file.type,
          upload_status: 'completed'
        })
        .select()
        .single()

      if (dbError) throw dbError

      return fileRecord
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // AI Processing Pipeline
  async processImageWithOCR(fileUrl: string): Promise<{ text: string; confidence: number }> {
    try {
      // This would integrate with Google Vision API or similar OCR service
      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fileUrl })
      })

      if (!response.ok) throw new Error('OCR processing failed')
      
      const result = await response.json()
      return {
        text: result.extractedText || '',
        confidence: result.confidence || 0
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      throw error
    }
  }

  async processVoiceTranscription(fileUrl: string): Promise<{ text: string; confidence: number }> {
    try {
      const response = await fetch('/api/ai/speech-to-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: fileUrl })
      })

      if (!response.ok) throw new Error('Speech-to-text processing failed')
      
      const result = await response.json()
      return {
        text: result.transcription || '',
        confidence: result.confidence || 0
      }
    } catch (error) {
      console.error('Voice transcription error:', error)
      throw error
    }
  }

  async extractBusinessPlan(
    inputs: { text?: string; images?: string[]; voice?: string }
  ): Promise<{ businessPlan: BusinessPlanJSON; confidence: number }> {
    try {
      const response = await fetch('/api/ai/extract-business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      })

      if (!response.ok) throw new Error('Business plan extraction failed')
      
      const result = await response.json()
      return {
        businessPlan: result.businessPlan,
        confidence: result.confidence || 0
      }
    } catch (error) {
      console.error('Business plan extraction error:', error)
      throw error
    }
  }

  // Automated Scoring
  async calculateAutomatedScore(businessPlan: BusinessPlanJSON): Promise<{
    totalScore: number
    breakdown: {
      market_potential: number
      business_clarity: number
      financial_feasibility: number
      competitive_advantage: number
      entrepreneur_capability: number
    }
  }> {
    try {
      const response = await fetch('/api/ai/score-business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessPlan })
      })

      if (!response.ok) throw new Error('Automated scoring failed')
      
      return await response.json()
    } catch (error) {
      console.error('Automated scoring error:', error)
      throw error
    }
  }

  // Complete Processing Pipeline
  async processApplication(evaluationId: string): Promise<void> {
    try {
      // Get all uploaded files for this evaluation
      const { data: files, error } = await supabase
        .from('application_files')
        .select('*')
        .eq('evaluation_id', evaluationId)

      if (error) throw error

      let extractedTexts: string[] = []
      let imageUrls: string[] = []
      let voiceTexts: string[] = []

      // Process each file
      for (const file of files || []) {
        if (file.file_type === 'image' || file.file_type === 'sketch') {
          const ocrResult = await this.processImageWithOCR(file.file_url)
          extractedTexts.push(ocrResult.text)
          imageUrls.push(file.file_url)
          
          // Update file with OCR results
          await supabase
            .from('application_files')
            .update({
              extracted_text: ocrResult.text,
              confidence_score: ocrResult.confidence,
              processing_results: { ocr: ocrResult }
            })
            .eq('id', file.id)
        } else if (file.file_type === 'voice') {
          const transcription = await this.processVoiceTranscription(file.file_url)
          voiceTexts.push(transcription.text)
          
          // Update file with transcription results
          await supabase
            .from('application_files')
            .update({
              extracted_text: transcription.text,
              confidence_score: transcription.confidence,
              processing_results: { transcription }
            })
            .eq('id', file.id)
        }
      }

      // Extract business plan from all inputs
      const combinedText = [...extractedTexts, ...voiceTexts].join('\n\n')
      const { businessPlan, confidence } = await this.extractBusinessPlan({
        text: combinedText,
        images: imageUrls,
        voice: voiceTexts.join('\n')
      })

      // Calculate automated score
      const scoreResult = await this.calculateAutomatedScore(businessPlan)

      // Update evaluation with processed results
      await supabase
        .from('evaluations')
        .update({
          business_plan_json: businessPlan,
          extraction_confidence: confidence,
          automated_score: scoreResult.totalScore,
          market_viability: scoreResult.breakdown.market_potential * 50, // Scale to 0-100
          financial_feasibility: scoreResult.breakdown.financial_feasibility * 50,
          innovation_index: scoreResult.breakdown.competitive_advantage * 50,
          execution_readiness: scoreResult.breakdown.business_clarity * 50,
          scalability_potential: scoreResult.breakdown.entrepreneur_capability * 50,
          status: 'completed',
          processed_inputs: {
            extracted_texts: extractedTexts,
            voice_transcriptions: voiceTexts,
            confidence_scores: confidence
          }
        })
        .eq('id', evaluationId)

    } catch (error) {
      console.error('Application processing error:', error)
      
      // Update evaluation status to failed
      await supabase
        .from('evaluations')
        .update({ status: 'failed' })
        .eq('id', evaluationId)
      
      throw error
    }
  }

  // Mentor Assignment
  async assignMentor(evaluationId: string, mentorId: string, assignedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mentor_assignments')
        .insert({
          evaluation_id: evaluationId,
          mentor_id: mentorId,
          assigned_by: assignedBy,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })

      if (error) throw error

      // Update evaluation status
      await supabase
        .from('evaluations')
        .update({
          status: 'reviewing',
          mentor_assigned_at: new Date().toISOString()
        })
        .eq('id', evaluationId)

    } catch (error) {
      console.error('Mentor assignment error:', error)
      throw error
    }
  }

  // Get Business Plan Template
  async getBusinessPlanTemplate(templateId?: string): Promise<any> {
    try {
      let query = supabase
        .from('business_plan_templates')
        .select('*')
        .eq('is_active', true)

      if (templateId) {
        query = query.eq('id', templateId)
      } else {
        query = query.eq('name', 'Tata Strive Standard')
      }

      const { data, error } = await query.single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching business plan template:', error)
      throw error
    }
  }
}

export const tataStriveAPI = new TataStriveAPIService()
