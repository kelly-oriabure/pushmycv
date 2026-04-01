-- PushMyCV Complete Database Schema
-- Comprehensive schema for CV/Resume management and job application automation

-- ============================================================================
-- USERS AND PROFILES
-- ============================================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id)
);

-- ============================================================================
-- RESUME AND CV DATA
-- ============================================================================

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template TEXT DEFAULT 'modern',
    is_default BOOLEAN DEFAULT false,
    file_url TEXT,
    file_format TEXT DEFAULT 'pdf',
    status TEXT DEFAULT 'draft', -- draft, published, archived
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Work experience
CREATE TABLE IF NOT EXISTS work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    description TEXT,
    achievements JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Education
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    gpa TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT, -- technical, soft, language, etc.
    proficiency TEXT, -- beginner, intermediate, advanced, expert
    years_of_experience INT,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    technologies JSONB DEFAULT '[]',
    project_url TEXT,
    github_url TEXT,
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- JOB LISTINGS AND APPLICATIONS
-- ============================================================================

-- Job listings
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo_url TEXT,
    location TEXT,
    job_type TEXT, -- full-time, part-time, contract, remote
    salary_min INT,
    salary_max INT,
    salary_currency TEXT DEFAULT 'USD',
    description TEXT,
    requirements JSONB DEFAULT '[]',
    responsibilities JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    application_url TEXT,
    source TEXT, -- linkedin, indeed, company_website, etc.
    source_job_id TEXT,
    posted_date TIMESTAMP,
    deadline TIMESTAMP,
    status TEXT DEFAULT 'active', -- active, closed, filled
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Job applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id),
    cover_letter_id UUID,
    status TEXT DEFAULT 'pending', -- pending, submitted, interviewing, rejected, accepted
    applied_at TIMESTAMP,
    response_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Cover letters
CREATE TABLE IF NOT EXISTS cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- JOB MATCHING AND PREFERENCES
-- ============================================================================

-- User job preferences
CREATE TABLE IF NOT EXISTS job_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_job_types JSONB DEFAULT '[]',
    preferred_locations JSONB DEFAULT '[]',
    preferred_industries JSONB DEFAULT '[]',
    min_salary INT,
    max_salary INT,
    salary_currency TEXT DEFAULT 'USD',
    remote_only BOOLEAN DEFAULT false,
    willing_to_relocate BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id)
);

-- Job matches (AI-powered matching)
CREATE TABLE IF NOT EXISTS job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    match_score INT CHECK (match_score >= 0 AND match_score <= 100),
    matching_skills JSONB DEFAULT '[]',
    missing_skills JSONB DEFAULT '[]',
    ai_analysis TEXT,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, job_id)
);

-- ============================================================================
-- AUTOMATION AND TRACKING
-- ============================================================================

-- Application tracking events
CREATE TABLE IF NOT EXISTS application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- status_change, interview_scheduled, email_received, etc.
    event_data JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_type TEXT, -- follow_up, thank_you, networking, etc.
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Resumes indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);

-- Work experience indexes
CREATE INDEX IF NOT EXISTS idx_work_experiences_user_id ON work_experiences(user_id);

-- Education indexes
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);

-- Skills indexes
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- Cover letters indexes
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id ON cover_letters(job_id);

-- Job matches indexes
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(match_score DESC);

-- Application events indexes
CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_application_events_created_at ON application_events(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Update updated_at for profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for resumes
CREATE TRIGGER update_resumes_updated_at 
    BEFORE UPDATE ON resumes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for work_experiences
CREATE TRIGGER update_work_experiences_updated_at 
    BEFORE UPDATE ON work_experiences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for education
CREATE TRIGGER update_education_updated_at 
    BEFORE UPDATE ON education 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for certifications
CREATE TRIGGER update_certifications_updated_at 
    BEFORE UPDATE ON certifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for jobs
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for applications
CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for cover_letters
CREATE TRIGGER update_cover_letters_updated_at 
    BEFORE UPDATE ON cover_letters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for job_preferences
CREATE TRIGGER update_job_preferences_updated_at 
    BEFORE UPDATE ON job_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for email_templates
CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resumes policies
CREATE POLICY "Users can view their own resumes" ON resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own resumes" ON resumes
    FOR ALL USING (auth.uid() = user_id);

-- Work experiences policies
CREATE POLICY "Users can manage their own work experiences" ON work_experiences
    FOR ALL USING (auth.uid() = user_id);

-- Education policies
CREATE POLICY "Users can manage their own education" ON education
    FOR ALL USING (auth.uid() = user_id);

-- Skills policies
CREATE POLICY "Users can manage their own skills" ON skills
    FOR ALL USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Users can manage their own certifications" ON certifications
    FOR ALL USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- Jobs policies (public read, service role write)
CREATE POLICY "Anyone can view active jobs" ON jobs
    FOR SELECT USING (status = 'active');

-- Applications policies
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own applications" ON applications
    FOR ALL USING (auth.uid() = user_id);

-- Cover letters policies
CREATE POLICY "Users can manage their own cover letters" ON cover_letters
    FOR ALL USING (auth.uid() = user_id);

-- Job preferences policies
CREATE POLICY "Users can manage their own job preferences" ON job_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Job matches policies
CREATE POLICY "Users can view their own job matches" ON job_matches
    FOR SELECT USING (auth.uid() = user_id);

-- Application events policies
CREATE POLICY "Users can view events for their applications" ON application_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_events.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Email templates policies
CREATE POLICY "Users can manage their own email templates" ON email_templates
    FOR ALL USING (auth.uid() = user_id);
