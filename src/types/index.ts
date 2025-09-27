export interface BusinessIdea {
    id?: string;
    title: string;
    description: string;
    industry: string;
    targetMarket: string;
    submittedAt?: Date;
    language?: string;
    userId?: string;
  }
  
  export interface EvaluationResult {
    id: string;
    ideaId: string;
    overallScore: number;
    dimensions: {
      marketViability: DimensionScore;
      financialFeasibility: DimensionScore;
      executionReadiness: DimensionScore;
      innovationIndex: DimensionScore;
      scalabilityPotential: DimensionScore;
    };
    feedback: {
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      nextSteps: string[];
    };
    language: string;
    evaluatedAt: Date;
  }
  
  export interface DimensionScore {
    score: number;
    confidence: number;
    reasoning: string;
    suggestions: string[];
  }
  
  export interface FileUploadData {
    file: File;
    type: 'handwriting' | 'audio' | 'document';
    preview?: string;
    extractedText?: string;
  }
  
  export interface AudioRecording {
    blob: Blob;
    duration: number;
    url: string;
  }
  
  export interface HandwritingAnalysis {
    extractedText: string;
    confidence: number;
    detectedLanguage: string;
    boundingBoxes: BoundingBox[];
  }
  
  export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
  }
  
  export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    preferredLanguage: string;
    role: 'entrepreneur' | 'mentor' | 'admin';
  }
  
  export interface DashboardStats {
    totalIdeas: number;
    averageScore: number;
    topCategory: string;
    recentEvaluations: number;
  }
  
  export type Language = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'gu' | 'mr' | 'bn' | 'pa';
  
  export type Theme = 'light' | 'dark' | 'system';
  