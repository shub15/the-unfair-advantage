-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('entrepreneur', 'mentor', 'admin');
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE evaluation_status AS ENUM ('pending', 'completed', 'failed', 'reviewing');
CREATE TYPE mentorship_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE review_status AS ENUM ('draft', 'submitted', 'reviewed');
CREATE TYPE message_type AS ENUM ('text', 'file', 'image', 'link');

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'entrepreneur',
    preferred_language TEXT NOT NULL DEFAULT 'en',
    bio TEXT,
    location TEXT,
    website TEXT,
    skills TEXT[],
    industries TEXT[],
    experience INTEGER,
    hourly_rate INTEGER,
    availability availability_status DEFAULT 'available',
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EVALUATIONS TABLE
-- =============================================
CREATE TABLE public.evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    industry TEXT NOT NULL,
    target_market TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    status evaluation_status DEFAULT 'pending',
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    market_viability INTEGER CHECK (market_viability >= 0 AND market_viability <= 100),
    financial_feasibility INTEGER CHECK (financial_feasibility >= 0 AND financial_feasibility <= 100),
    execution_readiness INTEGER CHECK (execution_readiness >= 0 AND execution_readiness <= 100),
    innovation_index INTEGER CHECK (innovation_index >= 0 AND innovation_index <= 100),
    scalability_potential INTEGER CHECK (scalability_potential >= 0 AND scalability_potential <= 100),
    ai_analysis_data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5) NOT NULL,
    strengths TEXT[] NOT NULL,
    weaknesses TEXT[] NOT NULL,
    recommendations TEXT[] NOT NULL,
    next_steps TEXT[] NOT NULL,
    detailed_feedback TEXT,
    is_helpful BOOLEAN,
    helpful_votes INTEGER DEFAULT 0,
    status review_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MENTORSHIP TABLE
-- =============================================
CREATE TABLE public.mentorship (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    status mentorship_status DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    goals TEXT[],
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_reviews INTEGER DEFAULT 0,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, student_id)
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    mentorship_id UUID REFERENCES public.mentorship(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type message_type DEFAULT 'text',
    attachments TEXT[],
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_rating ON public.user_profiles(rating DESC);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- Evaluations indexes
CREATE INDEX idx_evaluations_user_id ON public.evaluations(user_id);
CREATE INDEX idx_evaluations_status ON public.evaluations(status);
CREATE INDEX idx_evaluations_overall_score ON public.evaluations(overall_score DESC);
CREATE INDEX idx_evaluations_submitted_at ON public.evaluations(submitted_at DESC);
CREATE INDEX idx_evaluations_industry ON public.evaluations(industry);
CREATE INDEX idx_evaluations_public ON public.evaluations(is_public, status);

-- Reviews indexes
CREATE INDEX idx_reviews_evaluation_id ON public.reviews(evaluation_id);
CREATE INDEX idx_reviews_mentor_id ON public.reviews(mentor_id);
CREATE INDEX idx_reviews_student_id ON public.reviews(student_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Mentorship indexes
CREATE INDEX idx_mentorship_mentor_id ON public.mentorship(mentor_id);
CREATE INDEX idx_mentorship_student_id ON public.mentorship(student_id);
CREATE INDEX idx_mentorship_status ON public.mentorship(status);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(receiver_id, is_read, is_deleted);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Evaluations policies
CREATE POLICY "Users can view their own evaluations" ON public.evaluations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public evaluations are viewable by everyone" ON public.evaluations
    FOR SELECT USING (is_public = true AND status = 'completed');

CREATE POLICY "Users can insert their own evaluations" ON public.evaluations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations" ON public.evaluations
    FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by related users" ON public.reviews
    FOR SELECT USING (
        auth.uid() = mentor_id OR 
        auth.uid() = student_id OR
        auth.uid() IN (SELECT user_id FROM public.evaluations WHERE id = evaluation_id)
    );

CREATE POLICY "Mentors can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = mentor_id AND
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'mentor')
    );

CREATE POLICY "Mentors can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = mentor_id);

-- Mentorship policies
CREATE POLICY "Mentorship viewable by related users" ON public.mentorship
    FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = student_id);

CREATE POLICY "Users can create mentorship requests" ON public.mentorship
    FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = mentor_id);

CREATE POLICY "Related users can update mentorship" ON public.mentorship
    FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = student_id);

-- Messages policies
CREATE POLICY "Messages viewable by sender and receiver" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentorship_updated_at BEFORE UPDATE ON public.mentorship
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
