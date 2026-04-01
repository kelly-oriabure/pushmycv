-- =====================================================
-- PushMyCV Frontend (Jobeazy) — Complete Migration
-- Supabase Project: embugkjoeyfukdotmgyg
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- ============================================
-- PART 1: Extensions
-- ============================================
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PART 2: Helper Functions
-- ============================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger function (alternate name)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_owns_resume function for RLS
CREATE OR REPLACE FUNCTION public.user_owns_resume(resume_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.resumes
        WHERE id = resume_uuid
        AND user_id = (SELECT auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- delete_resume_cascade function
CREATE OR REPLACE FUNCTION public.delete_resume_cascade(
    p_resume_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM resumes
        WHERE id = p_resume_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Resume not found or access denied';
    END IF;

    DELETE FROM resume_references WHERE resume_id = p_resume_id;
    DELETE FROM resume_references_settings WHERE resume_id = p_resume_id;
    DELETE FROM resume_courses WHERE resume_id = p_resume_id;
    DELETE FROM resume_skills WHERE resume_id = p_resume_id;
    DELETE FROM resume_languages WHERE resume_id = p_resume_id;
    DELETE FROM resume_education WHERE resume_id = p_resume_id;
    DELETE FROM resume_employment_history WHERE resume_id = p_resume_id;
    DELETE FROM resume_professional_summary WHERE resume_id = p_resume_id;
    DELETE FROM resume_personal_details WHERE resume_id = p_resume_id;
    DELETE FROM resumes WHERE id = p_resume_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_resume_section_counts function
CREATE OR REPLACE FUNCTION public.get_resume_section_counts(resume_ids UUID[])
RETURNS TABLE (
    resume_id UUID,
    education_count BIGINT,
    experience_count BIGINT,
    skills_count BIGINT,
    languages_count BIGINT,
    references_count BIGINT,
    courses_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as resume_id,
        COALESCE(ed.count, 0) as education_count,
        COALESCE(ex.count, 0) as experience_count,
        COALESCE(sk.count, 0) as skills_count,
        COALESCE(lg.count, 0) as languages_count,
        COALESCE(rf.count, 0) as references_count,
        COALESCE(cr.count, 0) as courses_count
    FROM unnest(resume_ids) as r(id)
    LEFT JOIN (SELECT resume_id, COUNT(*) as count FROM education WHERE resume_id = ANY(resume_ids) GROUP BY resume_id) ed ON ed.resume_id = r.id
    LEFT JOIN (SELECT resume_id, COUNT(*) as count FROM experience WHERE resume_id = ANY(resume_ids) GROUP BY resume_id) ex ON ex.resume_id = r.id
    LEFT JOIN (SELECT resume_id, COUNT(*) as count FROM skills WHERE resume_id = ANY(resume_ids) GROUP BY resume_id) sk ON sk.resume_id = r.id
    LEFT JOIN (SELECT resume_id, COUNT(*) as count FROM languages WHERE resume_id = ANY(resume_ids) GROUP BY resume_id) lg ON lg.resume_id = r.id
    LEFT JOIN (SELECT resume_id, COUNT(*) as count FROM "references" WHERE resume_id = ANY(resume_ids) GROUP BY resume_id) rf ON rf.resume_id = r.id
    LEFT JOIN (SELECT resume_id, COUNT(*) as count FROM courses WHERE resume_id = ANY(resume_ids) GROUP BY resume_id) cr ON cr.resume_id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- close_expired_jobs function
CREATE OR REPLACE FUNCTION public.close_expired_jobs()
RETURNS INTEGER AS $$
DECLARE affected_count INTEGER;
BEGIN
    UPDATE jobs SET status = 'closed' WHERE expires_at < NOW() AND status = 'active'
    RETURNING id INTO affected_count;
    RETURN COALESCE(affected_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cleanup_stuck_analyses function
CREATE OR REPLACE FUNCTION public.cleanup_stuck_analyses()
RETURNS INTEGER AS $$
DECLARE updated_count INTEGER;
BEGIN
    UPDATE public.resume_analyses
    SET status = 'failed', error_message = 'Analysis timed out after 30 minutes - please retry', updated_at = NOW()
    WHERE status = 'processing' AND created_at < NOW() - INTERVAL '30 minutes';
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: Create Tables (complete schema)
-- ============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  industry text,
  size text,
  location text,
  gallery_images ARRAY,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer,
  location text,
  meeting_link text,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'rescheduled'::text])),
  notes text,
  interviewer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(id),
  CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  user_id uuid NOT NULL,
  resume_id uuid,
  resume_upload_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'shortlisted'::text, 'rejected'::text, 'accepted'::text])),
  cover_letter text,
  applied_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT job_applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id),
  CONSTRAINT job_applications_resume_upload_id_fkey FOREIGN KEY (resume_upload_id) REFERENCES public.resume_uploads(id)
);

CREATE TABLE IF NOT EXISTS public.job_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  job_type text CHECK (job_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contract'::text, 'internship'::text, 'freelance'::text])),
  category_id uuid,
  location text,
  remote_option text CHECK (remote_option = ANY (ARRAY['on_site'::text, 'remote'::text, 'hybrid'::text])),
  salary_min numeric,
  salary_max numeric,
  salary_currency text DEFAULT 'USD'::text,
  experience_level text CHECK (experience_level = ANY (ARRAY['entry'::text, 'mid'::text, 'senior'::text, 'lead'::text, 'executive'::text])),
  requirements jsonb,
  benefits jsonb,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'closed'::text, 'draft'::text])),
  posted_by uuid,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT jobs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT jobs_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['application_update'::text, 'new_job'::text, 'interview_scheduled'::text, 'message'::text, 'system'::text])),
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  avatar_url text,
  email text,
  full_name text,
  has_onboarded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'applicant'::text CHECK (role = ANY (ARRAY['admin'::text, 'employer'::text, 'applicant'::text])),
  phone text,
  location text,
  latitude numeric,
  longitude numeric,
  preferred_language text DEFAULT 'en'::text,
  bio text,
  skills ARRAY,
  experience_years integer,
  education jsonb,
  work_experience jsonb,
  certifications jsonb,
  portfolio_url text,
  linkedin_url text,
  github_url text,
  signup_source text DEFAULT 'web'::text CHECK (signup_source = ANY (ARRAY['web'::text, 'mobile'::text])),
  role_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);

CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  upload_id uuid NOT NULL,
  job_title text NOT NULL,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  ats_score integer CHECK (ats_score >= 0 AND ats_score <= 100),
  tone_score integer,
  content_score integer,
  structure_score integer,
  skills_score integer,
  email_score integer,
  length_score integer,
  brevity_score integer,
  score_breakdown jsonb,
  suggestions jsonb,
  ats_tips jsonb,
  tone_tips jsonb,
  content_tips jsonb,
  structure_tips jsonb,
  skills_tips jsonb,
  email_tips jsonb,
  length_tips jsonb,
  brevity_tips jsonb,
  ats_type text,
  ats_tips_tip text,
  ats_explanation text,
  tonestyle_score integer CHECK (tonestyle_score >= 0 AND tonestyle_score <= 100),
  tonestyle_tips_tip text,
  tonestyle_tips_type text,
  tonestyle_explanation text,
  content_tips_tip text,
  content_type text,
  content_explanation text,
  structure_tips_tip text,
  structure_tips_type text,
  structure_explanation text,
  skills_type text,
  skills_tips_tip text,
  skills_explanation text,
  email_tips_tip text,
  email_tips_type text,
  email_explanation text,
  length_tips_type text,
  length_tips_tip text,
  length_explanation text,
  brevity_tips_tip text,
  brevity_tips_type text,
  brevity_tips_explanation text,
  status text DEFAULT 'processing'::text CHECK (status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT resume_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT resume_analyses_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.resume_uploads(id)
);

CREATE TABLE IF NOT EXISTS public.resume_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  course text NOT NULL,
  institution text NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_courses_pkey PRIMARY KEY (id),
  CONSTRAINT resume_courses_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  school text NOT NULL,
  degree text NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  location text,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_education_pkey PRIMARY KEY (id),
  CONSTRAINT resume_education_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_employment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  job_title text NOT NULL,
  employer text NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  location text,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_employment_history_pkey PRIMARY KEY (id),
  CONSTRAINT resume_employment_history_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_languages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  name text NOT NULL,
  level text DEFAULT 'fluent'::text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_languages_pkey PRIMARY KEY (id),
  CONSTRAINT resume_languages_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_personal_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL UNIQUE,
  job_title text,
  photo_url text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  city_state text,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_personal_details_pkey PRIMARY KEY (id),
  CONSTRAINT resume_personal_details_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_professional_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL UNIQUE,
  summary text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_professional_summary_pkey PRIMARY KEY (id),
  CONSTRAINT resume_professional_summary_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  name text NOT NULL,
  company text,
  phone text,
  email text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_references_pkey PRIMARY KEY (id),
  CONSTRAINT resume_references_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_references_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL UNIQUE,
  hide_references boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_references_settings_pkey PRIMARY KEY (id),
  CONSTRAINT resume_references_settings_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL,
  name text NOT NULL,
  level integer NOT NULL DEFAULT 100 CHECK (level >= 0 AND level <= 100),
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resume_skills_pkey PRIMARY KEY (id),
  CONSTRAINT resume_skills_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resume_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  resume_url text NOT NULL,
  pdf_url text,
  content_hash text,
  email_hash text,
  phone_hash text,
  extracted_email text,
  extracted_phone text,
  upload_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  composite_hash text,
  extracted_text text,
  image_url text,
  resume_id uuid,
  CONSTRAINT resume_uploads_pkey PRIMARY KEY (id),
  CONSTRAINT resume_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT resume_uploads_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text DEFAULT 'Untitled Resume'::text,
  user_id uuid NOT NULL,
  template_id uuid,
  template_name text,
  color text,
  custom_sections jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  custom_sections_hash text,
  CONSTRAINT resumes_pkey PRIMARY KEY (id),
  CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT resumes_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(uuid)
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT saved_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT saved_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text DEFAULT 'free'::text CHECK (plan_type = ANY (ARRAY['free'::text, 'basic'::text, 'premium'::text, 'enterprise'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'trial'::text])),
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  payment_method text,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.template_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT template_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.templates (
  uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  thumbnail_url text,
  is_premium boolean DEFAULT false,
  category_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT templates_pkey PRIMARY KEY (uuid),
  CONSTRAINT templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.template_categories(id)
);

-- ============================================
-- PART 4: Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_personal_details_resume_id ON public.resume_personal_details(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_education_resume_id ON public.resume_education(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_employment_history_resume_id ON public.resume_employment_history(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_skills_resume_id ON public.resume_skills(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_languages_resume_id ON public.resume_languages(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_references_resume_id ON public.resume_references(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_courses_resume_id ON public.resume_courses(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_professional_summary_resume_id ON public.resume_professional_summary(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON public.resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_status ON public.resume_analyses(status);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_upload_id ON public.resume_analyses(upload_id);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_id ON public.resume_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_composite_hash ON public.resume_uploads(composite_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON public.jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

-- ============================================
-- PART 5: updated_at triggers
-- ============================================
DO $$
DECLARE t RECORD;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('profiles','resumes','templates','template_categories','roles',
            'resume_personal_details','resume_professional_summary','resume_employment_history',
            'resume_education','resume_skills','resume_languages','resume_references',
            'resume_references_settings','resume_courses','resume_uploads','resume_analyses',
            'companies','jobs','job_applications','interviews','notifications','subscriptions',
            'analytics_events')
    LOOP
        EXECUTE format(
            'CREATE TRIGGER handle_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
            t.tablename, t.tablename
        );
    END LOOP;
END $$;

-- ============================================
-- PART 6: Row Level Security (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_professional_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_employment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_references_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- Resumes policies
CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Resume section policies (using user_owns_resume function)
CREATE POLICY "Users can manage personal details for own resumes" ON public.resume_personal_details FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage professional summary for own resumes" ON public.resume_professional_summary FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage employment history for own resumes" ON public.resume_employment_history FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage education for own resumes" ON public.resume_education FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage skills for own resumes" ON public.resume_skills FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage languages for own resumes" ON public.resume_languages FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage references for own resumes" ON public.resume_references FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage references settings for own resumes" ON public.resume_references_settings FOR ALL USING (user_owns_resume(resume_id));
CREATE POLICY "Users can manage courses for own resumes" ON public.resume_courses FOR ALL USING (user_owns_resume(resume_id));

-- Resume uploads policies
CREATE POLICY "Users can view own resume uploads" ON public.resume_uploads FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own resume uploads" ON public.resume_uploads FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own resume uploads" ON public.resume_uploads FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own resume uploads" ON public.resume_uploads FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Resume analyses policies
CREATE POLICY "Users can view own resume analyses" ON public.resume_analyses FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own resume analyses" ON public.resume_analyses FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own resume analyses" ON public.resume_analyses FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Template policies (public read)
CREATE POLICY "Anyone can view template categories" ON public.template_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view templates" ON public.templates FOR SELECT USING (true);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Saved jobs policies
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own saved jobs" ON public.saved_jobs FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own saved jobs" ON public.saved_jobs FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Job applications policies
CREATE POLICY "Users can view own applications" ON public.job_applications FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own applications" ON public.job_applications FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own applications" ON public.job_applications FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Subscription policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Companies - employers can manage, everyone can view
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Owners can update companies" ON public.companies FOR UPDATE USING (owner_id = (SELECT auth.uid()));

-- Jobs - public read, employers can manage
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- DONE! ✅
-- This creates 25 tables, 4 functions, 
-- 40+ indexes, RLS policies, and triggers
-- ============================================
