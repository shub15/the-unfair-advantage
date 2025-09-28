-- Business Plan JSON Schema structure
CREATE TYPE business_plan_status AS ENUM ('draft', 'processing', 'ready', 'under_review', 'reviewed', 'approved', 'rejected');
CREATE TYPE input_type AS ENUM ('image', 'voice', 'text', 'sketch', 'combined');
CREATE TYPE evaluation_stage AS ENUM ('automated', 'mentor_review', 'admin_review', 'final');

-- Enhanced evaluations table for Tata Strive workflow
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_status_check;
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reviewing', 'approved', 'rejected'));

-- Add Tata Strive specific columns
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS input_type input_type DEFAULT 'text',
ADD COLUMN IF NOT EXISTS raw_inputs JSONB,
ADD COLUMN IF NOT EXISTS processed_inputs JSONB,
ADD COLUMN IF NOT EXISTS business_plan_json JSONB,
ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS eligibility_score DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS automated_score DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mentor_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mentor_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_decision TEXT,
ADD COLUMN IF NOT EXISTS tata_strive_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cohort_batch TEXT,
ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB;

-- File uploads table for storing images, sketches, voice recordings
CREATE TABLE IF NOT EXISTS public.application_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'voice', 'document', 'sketch')),
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_results JSONB,
    extracted_text TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- AI Processing pipeline tracking
CREATE TABLE IF NOT EXISTS public.ai_processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('ocr', 'image_analysis', 'voice_transcription', 'plan_extraction', 'scoring')),
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    processing_time_ms INTEGER,
    api_provider TEXT, -- 'gemini', 'openai', 'azure', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Business plan template schema
CREATE TABLE IF NOT EXISTS public.business_plan_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    schema_definition JSONB NOT NULL,
    scoring_weights JSONB NOT NULL,
    eligibility_criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentor assignments and evaluations
CREATE TABLE IF NOT EXISTS public.mentor_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.user_profiles(id),
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'declined')),
    due_date TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(evaluation_id, mentor_id)
);

-- Enhanced mentor evaluations
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS market_potential INTEGER CHECK (market_potential >= 0 AND market_potential <= 2),
ADD COLUMN IF NOT EXISTS business_clarity INTEGER CHECK (business_clarity >= 0 AND business_clarity <= 2),
ADD COLUMN IF NOT EXISTS financial_feasibility INTEGER CHECK (financial_feasibility >= 0 AND financial_feasibility <= 2),
ADD COLUMN IF NOT EXISTS competitive_advantage INTEGER CHECK (competitive_advantage >= 0 AND competitive_advantage <= 2),
ADD COLUMN IF NOT EXISTS entrepreneur_capability INTEGER CHECK (entrepreneur_capability >= 0 AND entrepreneur_capability <= 2),
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER,
ADD COLUMN IF NOT EXISTS mentor_confidence INTEGER CHECK (mentor_confidence >= 1 AND mentor_confidence <= 5);

-- System analytics and metrics
CREATE TABLE IF NOT EXISTS public.system_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL,
    metric_value DECIMAL,
    metric_data JSONB,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    cohort_batch TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default business plan template
INSERT INTO public.business_plan_templates (name, version, schema_definition, scoring_weights) VALUES (
    'Tata Strive Standard',
    '1.0',
    '{
      "business_concept": {"required": true, "type": "string", "max_length": 2000},
      "target_market": {"required": true, "type": "string", "max_length": 1000},
      "revenue_model": {"required": true, "type": "string", "max_length": 1000},
      "key_resources": {"required": true, "type": "array", "items": "string"},
      "startup_costs": {"required": true, "type": "object", "properties": {"amount": "number", "currency": "string", "breakdown": "array"}},
      "competition_analysis": {"required": true, "type": "string", "max_length": 1000},
      "unique_selling_proposition": {"required": true, "type": "string", "max_length": 500},
      "market_size": {"required": false, "type": "string"},
      "financial_projections": {"required": false, "type": "object"},
      "team_background": {"required": false, "type": "string"},
      "implementation_timeline": {"required": false, "type": "array"}
    }',
    '{
      "market_potential": 2.0,
      "business_clarity": 2.0, 
      "financial_feasibility": 2.0,
      "competitive_advantage": 2.0,
      "entrepreneur_capability": 2.0
    }'
) ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_files_evaluation_id ON public.application_files(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_application_files_file_type ON public.application_files(file_type);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_evaluation_id ON public.ai_processing_jobs(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_status ON public.ai_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentor_id ON public.mentor_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_status ON public.mentor_assignments(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_tata_strive_id ON public.evaluations(tata_strive_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_cohort_batch ON public.evaluations(cohort_batch);

-- Enable RLS on new tables
ALTER TABLE public.application_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Application files - users can only see their own files
CREATE POLICY "Users can view their own application files" ON public.application_files
    FOR SELECT USING (
        evaluation_id IN (
            SELECT id FROM public.evaluations WHERE user_id = auth.uid()
        )
    );

-- Mentors can view files for assigned evaluations
CREATE POLICY "Mentors can view assigned application files" ON public.application_files
    FOR SELECT USING (
        evaluation_id IN (
            SELECT evaluation_id FROM public.mentor_assignments 
            WHERE mentor_id = auth.uid()
        )
    );

-- Admins can view all files
CREATE POLICY "Admins can view all application files" ON public.application_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Business plan templates - readable by all authenticated users
CREATE POLICY "Authenticated users can read business plan templates" ON public.business_plan_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Mentor assignments policies
CREATE POLICY "Users can view their mentor assignments" ON public.mentor_assignments
    FOR SELECT USING (
        mentor_id = auth.uid() OR 
        evaluation_id IN (
            SELECT id FROM public.evaluations WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
