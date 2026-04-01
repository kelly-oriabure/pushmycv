

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."close_expired_jobs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  affected_count integer;
BEGIN
  UPDATE jobs 
  SET status = 'closed' 
  WHERE expires_at < now() 
    AND status = 'active'
  RETURNING id INTO affected_count;
  
  RETURN COALESCE(affected_count, 0);
END;
$$;


ALTER FUNCTION "public"."close_expired_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_applications_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE jobs 
  SET applications_count = GREATEST(0, applications_count - 1)
  WHERE id = OLD.job_id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_applications_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_notifications"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  affected_count integer;
BEGIN
  DELETE FROM notifications 
  WHERE read = true 
    AND created_at < now() - interval '30 days'
  RETURNING id INTO affected_count;
  
  RETURN COALESCE(affected_count, 0);
END;
$$;


ALTER FUNCTION "public"."delete_old_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_resume_cascade"("resume_id" "uuid", "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Verify the resume belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM resumes 
        WHERE id = resume_id AND resumes.user_id = delete_resume_cascade.user_id
    ) THEN
        RAISE EXCEPTION 'Resume not found or access denied';
    END IF;

    -- Delete all related data in the correct order (respecting foreign key constraints)
    DELETE FROM personal_details WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM education WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM experience WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM skills WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM languages WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM "references" WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM courses WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM internships WHERE resume_id = delete_resume_cascade.resume_id;
    DELETE FROM professional_summaries WHERE resume_id = delete_resume_cascade.resume_id;
    
    -- Finally delete the resume itself
    DELETE FROM resumes WHERE id = delete_resume_cascade.resume_id;
END;
$$;


ALTER FUNCTION "public"."delete_resume_cascade"("resume_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_resume_cascade"("resume_id" "uuid", "user_id" "uuid") IS 'Efficiently deletes a resume and all related data in a single transaction';



CREATE OR REPLACE FUNCTION "public"."get_resume_section_counts"("resume_ids" "uuid"[]) RETURNS TABLE("resume_id" "uuid", "education_count" bigint, "experience_count" bigint, "skills_count" bigint, "languages_count" bigint, "references_count" bigint, "courses_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    LEFT JOIN (
        SELECT resume_id, COUNT(*) as count 
        FROM education 
        WHERE resume_id = ANY(resume_ids)
        GROUP BY resume_id
    ) ed ON ed.resume_id = r.id
    LEFT JOIN (
        SELECT resume_id, COUNT(*) as count 
        FROM experience 
        WHERE resume_id = ANY(resume_ids)
        GROUP BY resume_id
    ) ex ON ex.resume_id = r.id
    LEFT JOIN (
        SELECT resume_id, COUNT(*) as count 
        FROM skills 
        WHERE resume_id = ANY(resume_ids)
        GROUP BY resume_id
    ) sk ON sk.resume_id = r.id
    LEFT JOIN (
        SELECT resume_id, COUNT(*) as count 
        FROM languages 
        WHERE resume_id = ANY(resume_ids)
        GROUP BY resume_id
    ) lg ON lg.resume_id = r.id
    LEFT JOIN (
        SELECT resume_id, COUNT(*) as count 
        FROM "references" 
        WHERE resume_id = ANY(resume_ids)
        GROUP BY resume_id
    ) rf ON rf.resume_id = r.id
    LEFT JOIN (
        SELECT resume_id, COUNT(*) as count 
        FROM courses 
        WHERE resume_id = ANY(resume_ids)
        GROUP BY resume_id
    ) cr ON cr.resume_id = r.id;
END;
$$;


ALTER FUNCTION "public"."get_resume_section_counts"("resume_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_resume_section_counts"("resume_ids" "uuid"[]) IS 'Returns section counts for multiple resumes in a single query';



CREATE OR REPLACE FUNCTION "public"."get_user_extraction_stats"("user_id" "uuid") RETURNS TABLE("total_resumes" bigint, "pending_extractions" bigint, "completed_extractions" bigint, "failed_extractions" bigint, "avg_retry_count" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_resumes,
        COUNT(*) FILTER (WHERE extraction_status = 'pending') as pending_extractions,
        COUNT(*) FILTER (WHERE extraction_status = 'completed') as completed_extractions,
        COUNT(*) FILTER (WHERE extraction_status = 'failed') as failed_extractions,
        AVG(extraction_retry_count) as avg_retry_count
    FROM resumes 
    WHERE resumes.user_id = get_user_extraction_stats.user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_extraction_stats"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_extraction_stats"("user_id" "uuid") IS 'Returns extraction statistics for a specific user';



CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT r.permissions INTO user_permissions
    FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = user_id;
    
    RETURN COALESCE(user_permissions, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_applications_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE jobs 
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_applications_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_job_views"("job_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE jobs 
  SET views_count = views_count + 1
  WHERE id = job_uuid;
END;
$$;


ALTER FUNCTION "public"."increment_job_views"("job_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_application_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'application_update',
      'Application Status Updated',
      'Your application status changed to: ' || NEW.status,
      jsonb_build_object(
        'application_id', NEW.id, 
        'job_id', NEW.job_id, 
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_application_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_employer_new_application"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  employer_id uuid;
BEGIN
  -- Get the employer (company owner) for this job
  SELECT c.owner_id INTO employer_id
  FROM jobs j
  JOIN companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;
  
  -- Create notification for employer
  IF employer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      employer_id,
      'application_update',
      'New Job Application',
      'You received a new application for your job posting',
      jsonb_build_object(
        'application_id', NEW.id,
        'job_id', NEW.job_id,
        'applicant_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_employer_new_application"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_resume_statistics"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY resume_statistics;
END;
$$;


ALTER FUNCTION "public"."refresh_resume_statistics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_resume_statistics"() IS 'Refreshes the resume statistics materialized view';



CREATE OR REPLACE FUNCTION "public"."sync_profile_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If role_id is set, update role text
    IF NEW.role_id IS NOT NULL THEN
        SELECT name INTO NEW.role
        FROM roles
        WHERE id = NEW.role_id;
    END IF;
    
    -- If role text is set but role_id is not, set role_id
    IF NEW.role IS NOT NULL AND NEW.role_id IS NULL THEN
        SELECT id INTO NEW.role_id
        FROM roles
        WHERE name = NEW.role;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_profile_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_extraction_status"("resume_id" "uuid", "status" "text", "method" "text" DEFAULT NULL::"text", "error_message" "text" DEFAULT NULL::"text", "retry_count" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE resumes 
    SET 
        extraction_status = update_extraction_status.status,
        extraction_method = COALESCE(update_extraction_status.method, resumes.extraction_method),
        extraction_error = update_extraction_status.error_message,
        extraction_retry_count = COALESCE(update_extraction_status.retry_count, resumes.extraction_retry_count),
        extraction_completed_at = CASE 
            WHEN update_extraction_status.status = 'completed' THEN NOW()
            ELSE resumes.extraction_completed_at
        END,
        updated_at = NOW()
    WHERE id = resume_id;
END;
$$;


ALTER FUNCTION "public"."update_extraction_status"("resume_id" "uuid", "status" "text", "method" "text", "error_message" "text", "retry_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_extraction_status"("resume_id" "uuid", "status" "text", "method" "text", "error_message" "text", "retry_count" integer) IS 'Updates the extraction status and related fields for a resume';



CREATE OR REPLACE FUNCTION "public"."update_resume_courses_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_courses_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_education_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_education_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_employment_history_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_employment_history_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_languages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_languages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_personal_details_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_personal_details_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_professional_summary_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_professional_summary_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_references_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_references_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_references_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_references_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resume_skills_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resume_skills_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    user_permissions := get_user_permissions(user_id);
    RETURN user_permissions ? permission;
END;
$$;


ALTER FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_resume"("resume_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.resumes 
        WHERE id = resume_uuid 
        AND user_id = (SELECT auth.uid())
    );
END;
$$;


ALTER FUNCTION "public"."user_owns_resume"("resume_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_owns_resume"("resume_uuid" "uuid") IS 'Optimized function to check if user owns a resume. Uses (SELECT auth.uid()) for better RLS performance.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'Analytics and tracking events for user behavior';



COMMENT ON COLUMN "public"."analytics_events"."event_type" IS 'Event type: job_view, job_apply, search, profile_update, etc.';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "website" "text",
    "industry" "text",
    "size" "text",
    "location" "text",
    "gallery_images" "text"[],
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."companies" IS 'Companies/employers registered on the platform';



COMMENT ON COLUMN "public"."companies"."owner_id" IS 'User ID of the employer who owns this company profile';



CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer,
    "location" "text",
    "meeting_link" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "notes" "text",
    "interviewer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interviews_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'cancelled'::"text", 'rescheduled'::"text"])))
);


ALTER TABLE "public"."interviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."interviews" IS 'Interview schedules for job applications';



COMMENT ON COLUMN "public"."interviews"."meeting_link" IS 'Video call link for remote interviews';



CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resume_id" "uuid",
    "resume_upload_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "cover_letter" "text",
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "at_least_one_resume" CHECK ((("resume_id" IS NOT NULL) OR ("resume_upload_id" IS NOT NULL))),
    CONSTRAINT "job_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewing'::"text", 'shortlisted'::"text", 'rejected'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."job_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_applications" IS 'Job applications submitted by applicants';



COMMENT ON COLUMN "public"."job_applications"."resume_id" IS 'Reference to resume created with templates';



COMMENT ON COLUMN "public"."job_applications"."resume_upload_id" IS 'Reference to uploaded resume file';



COMMENT ON CONSTRAINT "at_least_one_resume" ON "public"."job_applications" IS 'Ensures at least one resume reference exists';



CREATE TABLE IF NOT EXISTS "public"."job_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "slug" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_categories" IS 'Job categories for organizing job listings (e.g., Design, Development, Marketing)';



CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "job_type" "text",
    "category_id" "uuid",
    "location" "text",
    "remote_option" "text",
    "salary_min" numeric,
    "salary_max" numeric,
    "salary_currency" "text" DEFAULT 'USD'::"text",
    "experience_level" "text",
    "requirements" "jsonb",
    "benefits" "jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "posted_by" "uuid",
    "views_count" integer DEFAULT 0,
    "applications_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "jobs_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['entry'::"text", 'mid'::"text", 'senior'::"text", 'lead'::"text", 'executive'::"text"]))),
    CONSTRAINT "jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['full_time'::"text", 'part_time'::"text", 'contract'::"text", 'internship'::"text", 'freelance'::"text"]))),
    CONSTRAINT "jobs_remote_option_check" CHECK (("remote_option" = ANY (ARRAY['on_site'::"text", 'remote'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'closed'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."jobs" IS 'Job listings posted by employers';



COMMENT ON COLUMN "public"."jobs"."remote_option" IS 'Work location type: on_site, remote, or hybrid';



COMMENT ON COLUMN "public"."jobs"."views_count" IS 'Number of times this job has been viewed';



COMMENT ON COLUMN "public"."jobs"."applications_count" IS 'Number of applications received for this job';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "read" boolean DEFAULT false,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['application_update'::"text", 'new_job'::"text", 'interview_scheduled'::"text", 'message'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'In-app notifications for users';



COMMENT ON COLUMN "public"."notifications"."data" IS 'Additional JSON data related to the notification (e.g., job_id, application_id)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "email" "text",
    "full_name" "text",
    "has_onboarded" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'applicant'::"text",
    "phone" "text",
    "location" "text",
    "latitude" numeric,
    "longitude" numeric,
    "preferred_language" "text" DEFAULT 'en'::"text",
    "bio" "text",
    "skills" "text"[],
    "experience_years" integer,
    "education" "jsonb",
    "work_experience" "jsonb",
    "certifications" "jsonb",
    "portfolio_url" "text",
    "linkedin_url" "text",
    "github_url" "text",
    "signup_source" "text" DEFAULT 'web'::"text",
    "role_id" "uuid",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'employer'::"text", 'applicant'::"text"]))),
    CONSTRAINT "profiles_signup_source_check" CHECK (("signup_source" = ANY (ARRAY['web'::"text", 'mobile'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."role" IS 'User role: admin (platform admin), employer (company/recruiter), applicant (job seeker)';



COMMENT ON COLUMN "public"."profiles"."signup_source" IS 'Source of user signup: mobile (mobile app) or web (web application)';



COMMENT ON COLUMN "public"."profiles"."role_id" IS 'Foreign key reference to roles table';



CREATE TABLE IF NOT EXISTS "public"."resume_analyses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_title" "text" NOT NULL,
    "overall_score" integer,
    "score_breakdown" "jsonb",
    "suggestions" "jsonb",
    "ats_score" integer,
    "status" "text" DEFAULT 'processing'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "upload_id" "uuid" NOT NULL,
    "tone_score" integer,
    "content_score" integer,
    "structure_score" integer,
    "skills_score" integer,
    "email_score" integer,
    "length_score" integer,
    "brevity_score" integer,
    "ats_tips" "jsonb",
    "tone_tips" "jsonb",
    "content_tips" "jsonb",
    "structure_tips" "jsonb",
    "skills_tips" "jsonb",
    "email_tips" "jsonb",
    "length_tips" "jsonb",
    "brevity_tips" "jsonb",
    "ats_type" "text",
    "ats_tips_tip" "text",
    "ats_explanation" "text",
    "tonestyle_score" integer,
    "tonestyle_tips_tip" "text",
    "tonestyle_tips_type" "text",
    "tonestyle_explanation" "text",
    "content_tips_tip" "text",
    "content_type" "text",
    "content_explanation" "text",
    "structure_tips_tip" "text",
    "structure_tips_type" "text",
    "structure_explanation" "text",
    "skills_type" "text",
    "skills_tips_tip" "text",
    "skills_explanation" "text",
    "email_tips_tip" "text",
    "email_tips_type" "text",
    "email_explanation" "text",
    "length_tips_type" "text",
    "length_tips_tip" "text",
    "length_explanation" "text",
    "brevity_tips_tip" "text",
    "brevity_tips_type" "text",
    "brevity_tips_explanation" "text",
    CONSTRAINT "resume_analyses_ats_score_check" CHECK ((("ats_score" >= 0) AND ("ats_score" <= 100))),
    CONSTRAINT "resume_analyses_overall_score_check" CHECK ((("overall_score" >= 0) AND ("overall_score" <= 100))),
    CONSTRAINT "resume_analyses_status_check" CHECK (("status" = ANY (ARRAY['processing'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "resume_analyses_tonestyle_score_check" CHECK ((("tonestyle_score" >= 0) AND ("tonestyle_score" <= 100)))
);


ALTER TABLE "public"."resume_analyses" OWNER TO "postgres";


COMMENT ON TABLE "public"."resume_analyses" IS 'Unused indexes idx_resume_analyses_* removed for performance optimization';



COMMENT ON COLUMN "public"."resume_analyses"."ats_score" IS 'ATS compatibility score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."upload_id" IS 'Required foreign key reference to resume_uploads table for file information';



COMMENT ON COLUMN "public"."resume_analyses"."tone_score" IS 'Tone and style score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."content_score" IS 'Content quality score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."structure_score" IS 'Structure and formatting score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."skills_score" IS 'Skills relevance score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."email_score" IS 'Email format and professionalism score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."length_score" IS 'Resume length appropriateness score (0-100)';



COMMENT ON COLUMN "public"."resume_analyses"."brevity_score" IS 'Brevity and conciseness score (0-100)';



CREATE TABLE IF NOT EXISTS "public"."resume_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "course" "text" NOT NULL,
    "institution" "text" NOT NULL,
    "start_date" "text" NOT NULL,
    "end_date" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "school" "text" NOT NULL,
    "degree" "text" NOT NULL,
    "start_date" "text" NOT NULL,
    "end_date" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_employment_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "job_title" "text" NOT NULL,
    "employer" "text" NOT NULL,
    "start_date" "text" NOT NULL,
    "end_date" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_employment_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_languages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_languages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_personal_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "job_title" "text",
    "photo_url" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address" "text",
    "city_state" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_personal_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_professional_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "summary" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_professional_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "company" "text",
    "phone" "text",
    "email" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_references_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "hide_references" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_references_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "level" integer DEFAULT 100 NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resume_skills_level_check" CHECK ((("level" >= 0) AND ("level" <= 100)))
);


ALTER TABLE "public"."resume_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer,
    "resume_url" "text" NOT NULL,
    "pdf_url" "text",
    "content_hash" "text",
    "email_hash" "text",
    "phone_hash" "text",
    "extracted_email" "text",
    "extracted_phone" "text",
    "upload_time" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "composite_hash" "text",
    "extracted_text" "text",
    "image_url" "text"
);


ALTER TABLE "public"."resume_uploads" OWNER TO "postgres";


COMMENT ON TABLE "public"."resume_uploads" IS 'Unused indexes idx_resume_uploads_* removed for performance optimization';



COMMENT ON COLUMN "public"."resume_uploads"."content_hash" IS 'Hash of resume content for duplicate detection';



COMMENT ON COLUMN "public"."resume_uploads"."email_hash" IS 'Hash of extracted email for duplicate detection';



COMMENT ON COLUMN "public"."resume_uploads"."phone_hash" IS 'Hash of extracted phone for duplicate detection';



COMMENT ON COLUMN "public"."resume_uploads"."composite_hash" IS 'Composite hash combining content, email, and phone hashes for duplicate detection';



COMMENT ON COLUMN "public"."resume_uploads"."extracted_text" IS 'Full text content extracted from PDF resume';



COMMENT ON COLUMN "public"."resume_uploads"."image_url" IS 'URL of the resume image for preview';



CREATE TABLE IF NOT EXISTS "public"."resumes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" DEFAULT 'Untitled Resume'::"text",
    "user_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "template_name" "text",
    "color" "text",
    "custom_sections" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "custom_sections_hash" "text"
);


ALTER TABLE "public"."resumes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."resumes"."custom_sections_hash" IS 'SHA-256 hash of normalized custom_sections JSONB for change tracking and duplicate detection';



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."roles" IS 'User roles and their permissions';



CREATE TABLE IF NOT EXISTS "public"."saved_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."saved_jobs" IS 'Jobs saved/bookmarked by applicants for later viewing';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" DEFAULT 'free'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "payment_method" "text",
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'trial'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'User subscription plans and payment information';



COMMENT ON COLUMN "public"."subscriptions"."plan_type" IS 'Subscription tier: free, basic, premium, or enterprise';



CREATE TABLE IF NOT EXISTS "public"."template_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."template_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "thumbnail_url" "text",
    "is_premium" boolean DEFAULT false,
    "category_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."templates" IS 'Unused index idx_templates_category_id removed for performance optimization';



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_analyses"
    ADD CONSTRAINT "resume_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_courses"
    ADD CONSTRAINT "resume_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_education"
    ADD CONSTRAINT "resume_education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_employment_history"
    ADD CONSTRAINT "resume_employment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_languages"
    ADD CONSTRAINT "resume_languages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_personal_details"
    ADD CONSTRAINT "resume_personal_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_professional_summary"
    ADD CONSTRAINT "resume_professional_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_references"
    ADD CONSTRAINT "resume_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_references_settings"
    ADD CONSTRAINT "resume_references_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_skills"
    ADD CONSTRAINT "resume_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_uploads"
    ADD CONSTRAINT "resume_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_user_id_job_id_key" UNIQUE ("user_id", "job_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_categories"
    ADD CONSTRAINT "template_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."resume_personal_details"
    ADD CONSTRAINT "unique_resume_personal_details" UNIQUE ("resume_id");



ALTER TABLE ONLY "public"."resume_professional_summary"
    ADD CONSTRAINT "unique_resume_professional_summary" UNIQUE ("resume_id");



ALTER TABLE ONLY "public"."resume_references_settings"
    ADD CONSTRAINT "unique_resume_references_settings" UNIQUE ("resume_id");



CREATE INDEX "idx_analytics_created_at" ON "public"."analytics_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analytics_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_applications_applied_at" ON "public"."job_applications" USING "btree" ("applied_at" DESC);



CREATE INDEX "idx_applications_job_id" ON "public"."job_applications" USING "btree" ("job_id");



CREATE INDEX "idx_applications_status" ON "public"."job_applications" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_applications_unique" ON "public"."job_applications" USING "btree" ("job_id", "user_id");



CREATE INDEX "idx_applications_user_id" ON "public"."job_applications" USING "btree" ("user_id");



CREATE INDEX "idx_companies_industry" ON "public"."companies" USING "btree" ("industry");



CREATE INDEX "idx_companies_location" ON "public"."companies" USING "btree" ("location");



CREATE INDEX "idx_companies_owner_id" ON "public"."companies" USING "btree" ("owner_id");



CREATE INDEX "idx_interviews_application_id" ON "public"."interviews" USING "btree" ("application_id");



CREATE INDEX "idx_interviews_scheduled_at" ON "public"."interviews" USING "btree" ("scheduled_at");



CREATE INDEX "idx_interviews_status" ON "public"."interviews" USING "btree" ("status");



CREATE INDEX "idx_job_categories_slug" ON "public"."job_categories" USING "btree" ("slug");



CREATE INDEX "idx_jobs_category_id" ON "public"."jobs" USING "btree" ("category_id");



CREATE INDEX "idx_jobs_company_id" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_created_at" ON "public"."jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_jobs_experience_level" ON "public"."jobs" USING "btree" ("experience_level");



CREATE INDEX "idx_jobs_job_type" ON "public"."jobs" USING "btree" ("job_type");



CREATE INDEX "idx_jobs_location" ON "public"."jobs" USING "btree" ("location");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id_read" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_profiles_location" ON "public"."profiles" USING "btree" ("location");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_role_id" ON "public"."profiles" USING "btree" ("role_id");



CREATE INDEX "idx_profiles_signup_source" ON "public"."profiles" USING "btree" ("signup_source");



CREATE INDEX "idx_resume_courses_display_order" ON "public"."resume_courses" USING "btree" ("resume_id", "display_order");



CREATE INDEX "idx_resume_courses_resume_id" ON "public"."resume_courses" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_education_display_order" ON "public"."resume_education" USING "btree" ("resume_id", "display_order");



CREATE INDEX "idx_resume_education_resume_id" ON "public"."resume_education" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_employment_history_display_order" ON "public"."resume_employment_history" USING "btree" ("resume_id", "display_order");



CREATE INDEX "idx_resume_employment_history_resume_id" ON "public"."resume_employment_history" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_languages_display_order" ON "public"."resume_languages" USING "btree" ("resume_id", "display_order");



CREATE INDEX "idx_resume_languages_resume_id" ON "public"."resume_languages" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_personal_details_resume_id" ON "public"."resume_personal_details" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_professional_summary_resume_id" ON "public"."resume_professional_summary" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_references_display_order" ON "public"."resume_references" USING "btree" ("resume_id", "display_order");



CREATE INDEX "idx_resume_references_resume_id" ON "public"."resume_references" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_references_settings_resume_id" ON "public"."resume_references_settings" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_skills_display_order" ON "public"."resume_skills" USING "btree" ("resume_id", "display_order");



CREATE INDEX "idx_resume_skills_resume_id" ON "public"."resume_skills" USING "btree" ("resume_id");



CREATE INDEX "idx_resume_uploads_created_at" ON "public"."resume_uploads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_resume_uploads_user_id" ON "public"."resume_uploads" USING "btree" ("user_id");



CREATE INDEX "idx_resumes_created_at" ON "public"."resumes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_resumes_custom_sections_hash" ON "public"."resumes" USING "btree" ("custom_sections_hash");



CREATE INDEX "idx_resumes_template_id" ON "public"."resumes" USING "btree" ("template_id");



CREATE INDEX "idx_resumes_user_created" ON "public"."resumes" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_resumes_user_id" ON "public"."resumes" USING "btree" ("user_id");



CREATE INDEX "idx_roles_is_active" ON "public"."roles" USING "btree" ("is_active");



CREATE INDEX "idx_roles_name" ON "public"."roles" USING "btree" ("name");



CREATE INDEX "idx_saved_jobs_job_id" ON "public"."saved_jobs" USING "btree" ("job_id");



CREATE INDEX "idx_saved_jobs_user_id" ON "public"."saved_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_expires_at" ON "public"."subscriptions" USING "btree" ("expires_at");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "resume_analyses_upload_id_uidx" ON "public"."resume_analyses" USING "btree" ("upload_id");



CREATE UNIQUE INDEX "resume_uploads_composite_hash_uidx" ON "public"."resume_uploads" USING "btree" ("composite_hash") WHERE ("composite_hash" IS NOT NULL);



CREATE OR REPLACE TRIGGER "handle_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_resumes" BEFORE UPDATE ON "public"."resumes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_templates" BEFORE UPDATE ON "public"."templates" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_application_created" AFTER INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."increment_applications_count"();



CREATE OR REPLACE TRIGGER "on_application_deleted" AFTER DELETE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_applications_count"();



CREATE OR REPLACE TRIGGER "on_application_status_change" AFTER UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_application_status_change"();



CREATE OR REPLACE TRIGGER "on_new_application" AFTER INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_employer_new_application"();



CREATE OR REPLACE TRIGGER "resume_uploads_updated_at" BEFORE UPDATE ON "public"."resume_uploads" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "sync_profile_role_trigger" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_role"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_interviews_updated_at" BEFORE UPDATE ON "public"."interviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_applications_updated_at" BEFORE UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_resume_analyses_updated_at" BEFORE UPDATE ON "public"."resume_analyses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_resume_courses_updated_at" BEFORE UPDATE ON "public"."resume_courses" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_courses_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_education_updated_at" BEFORE UPDATE ON "public"."resume_education" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_education_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_employment_history_updated_at" BEFORE UPDATE ON "public"."resume_employment_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_employment_history_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_languages_updated_at" BEFORE UPDATE ON "public"."resume_languages" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_languages_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_personal_details_updated_at" BEFORE UPDATE ON "public"."resume_personal_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_personal_details_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_professional_summary_updated_at" BEFORE UPDATE ON "public"."resume_professional_summary" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_professional_summary_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_references_settings_updated_at" BEFORE UPDATE ON "public"."resume_references_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_references_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_references_updated_at" BEFORE UPDATE ON "public"."resume_references" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_references_updated_at"();



CREATE OR REPLACE TRIGGER "update_resume_skills_updated_at" BEFORE UPDATE ON "public"."resume_skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_resume_skills_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_resume_upload_id_fkey" FOREIGN KEY ("resume_upload_id") REFERENCES "public"."resume_uploads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."resume_analyses"
    ADD CONSTRAINT "resume_analyses_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."resume_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_analyses"
    ADD CONSTRAINT "resume_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_courses"
    ADD CONSTRAINT "resume_courses_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_education"
    ADD CONSTRAINT "resume_education_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_employment_history"
    ADD CONSTRAINT "resume_employment_history_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_languages"
    ADD CONSTRAINT "resume_languages_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_personal_details"
    ADD CONSTRAINT "resume_personal_details_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_professional_summary"
    ADD CONSTRAINT "resume_professional_summary_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_references"
    ADD CONSTRAINT "resume_references_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_references_settings"
    ADD CONSTRAINT "resume_references_settings_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_skills"
    ADD CONSTRAINT "resume_skills_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_uploads"
    ADD CONSTRAINT "resume_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("uuid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_jobs"
    ADD CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."template_categories"("id") ON DELETE SET NULL;



CREATE POLICY "Anyone can insert analytics events" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active jobs" ON "public"."jobs" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Anyone can view companies" ON "public"."companies" FOR SELECT USING (true);



CREATE POLICY "Anyone can view job categories" ON "public"."job_categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view roles" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Anyone can view template categories" ON "public"."template_categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view templates" ON "public"."templates" FOR SELECT USING (true);



CREATE POLICY "Applicants can create applications" ON "public"."job_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Applicants can delete own applications" ON "public"."job_applications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Applicants can view own applications" ON "public"."job_applications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Applicants can view own interviews" ON "public"."interviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."job_applications"
  WHERE (("job_applications"."id" = "interviews"."application_id") AND ("job_applications"."user_id" = "auth"."uid"())))));



CREATE POLICY "Employers can create companies" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Employers can create interviews" ON "public"."interviews" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."job_applications" "ja"
     JOIN "public"."jobs" "j" ON (("j"."id" = "ja"."job_id")))
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("ja"."id" = "interviews"."application_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can create jobs" ON "public"."jobs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "jobs"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can delete interviews" ON "public"."interviews" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (("public"."job_applications" "ja"
     JOIN "public"."jobs" "j" ON (("j"."id" = "ja"."job_id")))
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("ja"."id" = "interviews"."application_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can delete their jobs" ON "public"."jobs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "jobs"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can update application status" ON "public"."job_applications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."jobs" "j"
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("j"."id" = "job_applications"."job_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can update interviews" ON "public"."interviews" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."job_applications" "ja"
     JOIN "public"."jobs" "j" ON (("j"."id" = "ja"."job_id")))
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("ja"."id" = "interviews"."application_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can update their jobs" ON "public"."jobs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "jobs"."company_id") AND ("companies"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "jobs"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can view applications to their jobs" ON "public"."job_applications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."jobs" "j"
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("j"."id" = "job_applications"."job_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can view interviews for their jobs" ON "public"."interviews" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."job_applications" "ja"
     JOIN "public"."jobs" "j" ON (("j"."id" = "ja"."job_id")))
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("ja"."id" = "interviews"."application_id") AND ("c"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Employers can view their own jobs" ON "public"."jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "jobs"."company_id") AND ("companies"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Owners can delete their companies" ON "public"."companies" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can update their companies" ON "public"."companies" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users and service role can update resume analyses" ON "public"."resume_analyses" FOR UPDATE USING ((("auth"."role"() = 'service_role'::"text") OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



COMMENT ON POLICY "Users and service role can update resume analyses" ON "public"."resume_analyses" IS 'Consolidated UPDATE policy that handles both user and service role updates, reducing policy evaluation overhead';



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own resumes" ON "public"."resumes" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete their own resume courses" ON "public"."resume_courses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_courses"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume education" ON "public"."resume_education" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_education"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume employment history" ON "public"."resume_employment_history" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_employment_history"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume languages" ON "public"."resume_languages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_languages"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume personal details" ON "public"."resume_personal_details" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_personal_details"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume professional summary" ON "public"."resume_professional_summary" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_professional_summary"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume references" ON "public"."resume_references" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume references settings" ON "public"."resume_references_settings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references_settings"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume skills" ON "public"."resume_skills" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_skills"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own resume uploads" ON "public"."resume_uploads" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own resume analyses" ON "public"."resume_analyses" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own resumes" ON "public"."resumes" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own resume courses" ON "public"."resume_courses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_courses"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume education" ON "public"."resume_education" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_education"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume employment history" ON "public"."resume_employment_history" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_employment_history"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume languages" ON "public"."resume_languages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_languages"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume personal details" ON "public"."resume_personal_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_personal_details"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume professional summary" ON "public"."resume_professional_summary" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_professional_summary"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume references" ON "public"."resume_references" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume references settings" ON "public"."resume_references_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references_settings"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume skills" ON "public"."resume_skills" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_skills"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own resume uploads" ON "public"."resume_uploads" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can save jobs" ON "public"."saved_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unsave jobs" ON "public"."saved_jobs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own resumes" ON "public"."resumes" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own subscriptions" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own resume courses" ON "public"."resume_courses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_courses"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_courses"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume education" ON "public"."resume_education" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_education"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_education"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume employment history" ON "public"."resume_employment_history" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_employment_history"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_employment_history"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume languages" ON "public"."resume_languages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_languages"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_languages"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume personal details" ON "public"."resume_personal_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_personal_details"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_personal_details"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume professional summary" ON "public"."resume_professional_summary" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_professional_summary"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_professional_summary"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume references" ON "public"."resume_references" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume references settings" ON "public"."resume_references_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references_settings"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references_settings"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume skills" ON "public"."resume_skills" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_skills"."resume_id") AND ("resumes"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_skills"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own resume uploads" ON "public"."resume_uploads" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own analytics" ON "public"."analytics_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own resume analyses" ON "public"."resume_analyses" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own resumes" ON "public"."resumes" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "Users can view own resumes" ON "public"."resumes" IS 'Optimized RLS policy using (SELECT auth.uid()) for better performance';



CREATE POLICY "Users can view own saved jobs" ON "public"."saved_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own resume courses" ON "public"."resume_courses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_courses"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume education" ON "public"."resume_education" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_education"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume employment history" ON "public"."resume_employment_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_employment_history"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume languages" ON "public"."resume_languages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_languages"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume personal details" ON "public"."resume_personal_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_personal_details"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume professional summary" ON "public"."resume_professional_summary" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_professional_summary"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume references" ON "public"."resume_references" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume references settings" ON "public"."resume_references_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_references_settings"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume skills" ON "public"."resume_skills" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resumes"
  WHERE (("resumes"."id" = "resume_skills"."resume_id") AND ("resumes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own resume uploads" ON "public"."resume_uploads" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "Users can view their own resume uploads" ON "public"."resume_uploads" IS 'Optimized RLS policy using (SELECT auth.uid()) for better performance';



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_employment_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_languages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_personal_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_professional_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_references_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resumes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."close_expired_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."close_expired_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_expired_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_applications_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_applications_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_applications_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_resume_cascade"("resume_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_resume_cascade"("resume_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_resume_cascade"("resume_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_resume_section_counts"("resume_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_resume_section_counts"("resume_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_resume_section_counts"("resume_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_extraction_stats"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_extraction_stats"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_extraction_stats"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_applications_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_applications_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_applications_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_job_views"("job_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_job_views"("job_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_job_views"("job_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_application_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_application_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_application_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_employer_new_application"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_employer_new_application"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_employer_new_application"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_resume_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_resume_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_resume_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_extraction_status"("resume_id" "uuid", "status" "text", "method" "text", "error_message" "text", "retry_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_extraction_status"("resume_id" "uuid", "status" "text", "method" "text", "error_message" "text", "retry_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_extraction_status"("resume_id" "uuid", "status" "text", "method" "text", "error_message" "text", "retry_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_courses_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_courses_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_courses_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_education_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_education_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_education_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_employment_history_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_employment_history_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_employment_history_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_languages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_languages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_languages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_personal_details_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_personal_details_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_personal_details_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_professional_summary_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_professional_summary_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_professional_summary_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_references_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_references_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_references_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_references_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_references_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_references_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resume_skills_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resume_skills_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resume_skills_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_owns_resume"("resume_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_resume"("resume_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_resume"("resume_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."interviews" TO "anon";
GRANT ALL ON TABLE "public"."interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."interviews" TO "service_role";



GRANT ALL ON TABLE "public"."job_applications" TO "anon";
GRANT ALL ON TABLE "public"."job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applications" TO "service_role";



GRANT ALL ON TABLE "public"."job_categories" TO "anon";
GRANT ALL ON TABLE "public"."job_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."job_categories" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."resume_analyses" TO "anon";
GRANT ALL ON TABLE "public"."resume_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."resume_courses" TO "anon";
GRANT ALL ON TABLE "public"."resume_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_courses" TO "service_role";



GRANT ALL ON TABLE "public"."resume_education" TO "anon";
GRANT ALL ON TABLE "public"."resume_education" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_education" TO "service_role";



GRANT ALL ON TABLE "public"."resume_employment_history" TO "anon";
GRANT ALL ON TABLE "public"."resume_employment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_employment_history" TO "service_role";



GRANT ALL ON TABLE "public"."resume_languages" TO "anon";
GRANT ALL ON TABLE "public"."resume_languages" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_languages" TO "service_role";



GRANT ALL ON TABLE "public"."resume_personal_details" TO "anon";
GRANT ALL ON TABLE "public"."resume_personal_details" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_personal_details" TO "service_role";



GRANT ALL ON TABLE "public"."resume_professional_summary" TO "anon";
GRANT ALL ON TABLE "public"."resume_professional_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_professional_summary" TO "service_role";



GRANT ALL ON TABLE "public"."resume_references" TO "anon";
GRANT ALL ON TABLE "public"."resume_references" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_references" TO "service_role";



GRANT ALL ON TABLE "public"."resume_references_settings" TO "anon";
GRANT ALL ON TABLE "public"."resume_references_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_references_settings" TO "service_role";



GRANT ALL ON TABLE "public"."resume_skills" TO "anon";
GRANT ALL ON TABLE "public"."resume_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_skills" TO "service_role";



GRANT ALL ON TABLE "public"."resume_uploads" TO "anon";
GRANT ALL ON TABLE "public"."resume_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."resumes" TO "anon";
GRANT ALL ON TABLE "public"."resumes" TO "authenticated";
GRANT ALL ON TABLE "public"."resumes" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."saved_jobs" TO "anon";
GRANT ALL ON TABLE "public"."saved_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."template_categories" TO "anon";
GRANT ALL ON TABLE "public"."template_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."template_categories" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
