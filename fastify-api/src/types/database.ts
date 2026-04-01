export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    email: string;
                    full_name: string;
                    phone: string | null;
                    location: string | null;
                    linkedin_url: string | null;
                    github_url: string | null;
                    portfolio_url: string | null;
                    bio: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    email: string;
                    full_name: string;
                    phone?: string | null;
                    location?: string | null;
                    linkedin_url?: string | null;
                    github_url?: string | null;
                    portfolio_url?: string | null;
                    bio?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    email?: string;
                    full_name?: string;
                    phone?: string | null;
                    location?: string | null;
                    linkedin_url?: string | null;
                    github_url?: string | null;
                    portfolio_url?: string | null;
                    bio?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            resumes: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    template: string;
                    is_default: boolean;
                    file_url: string | null;
                    file_format: string;
                    status: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    template?: string;
                    is_default?: boolean;
                    file_url?: string | null;
                    file_format?: string;
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    template?: string;
                    is_default?: boolean;
                    file_url?: string | null;
                    file_format?: string;
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            work_experiences: {
                Row: {
                    id: string;
                    user_id: string;
                    company_name: string;
                    position: string;
                    location: string | null;
                    start_date: string;
                    end_date: string | null;
                    is_current: boolean;
                    description: string | null;
                    achievements: any[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    company_name: string;
                    position: string;
                    location?: string | null;
                    start_date: string;
                    end_date?: string | null;
                    is_current?: boolean;
                    description?: string | null;
                    achievements?: any[];
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    company_name?: string;
                    position?: string;
                    location?: string | null;
                    start_date?: string;
                    end_date?: string | null;
                    is_current?: boolean;
                    description?: string | null;
                    achievements?: any[];
                    created_at?: string;
                    updated_at?: string;
                };
            };
            education: {
                Row: {
                    id: string;
                    user_id: string;
                    institution: string;
                    degree: string;
                    field_of_study: string | null;
                    location: string | null;
                    start_date: string;
                    end_date: string | null;
                    is_current: boolean;
                    gpa: string | null;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    institution: string;
                    degree: string;
                    field_of_study?: string | null;
                    location?: string | null;
                    start_date: string;
                    end_date?: string | null;
                    is_current?: boolean;
                    gpa?: string | null;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    institution?: string;
                    degree?: string;
                    field_of_study?: string | null;
                    location?: string | null;
                    start_date?: string;
                    end_date?: string | null;
                    is_current?: boolean;
                    gpa?: string | null;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            skills: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    category: string | null;
                    proficiency: string | null;
                    years_of_experience: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    category?: string | null;
                    proficiency?: string | null;
                    years_of_experience?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    category?: string | null;
                    proficiency?: string | null;
                    years_of_experience?: number | null;
                    created_at?: string;
                };
            };
            certifications: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    issuing_organization: string;
                    issue_date: string;
                    expiry_date: string | null;
                    credential_id: string | null;
                    credential_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    issuing_organization: string;
                    issue_date: string;
                    expiry_date?: string | null;
                    credential_id?: string | null;
                    credential_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    issuing_organization?: string;
                    issue_date?: string;
                    expiry_date?: string | null;
                    credential_id?: string | null;
                    credential_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    technologies: any[];
                    project_url: string | null;
                    github_url: string | null;
                    start_date: string | null;
                    end_date: string | null;
                    is_ongoing: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    description?: string | null;
                    technologies?: any[];
                    project_url?: string | null;
                    github_url?: string | null;
                    start_date?: string | null;
                    end_date?: string | null;
                    is_ongoing?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    description?: string | null;
                    technologies?: any[];
                    project_url?: string | null;
                    github_url?: string | null;
                    start_date?: string | null;
                    end_date?: string | null;
                    is_ongoing?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            jobs: {
                Row: {
                    id: string;
                    title: string;
                    company: string;
                    company_logo_url: string | null;
                    location: string | null;
                    job_type: string | null;
                    salary_min: number | null;
                    salary_max: number | null;
                    salary_currency: string;
                    description: string | null;
                    requirements: any[];
                    responsibilities: any[];
                    benefits: any[];
                    application_url: string | null;
                    source: string | null;
                    source_job_id: string | null;
                    posted_date: string | null;
                    deadline: string | null;
                    status: string;
                    embedding: number[] | null;
                    embedding_status: string | null;
                    embedded_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    company: string;
                    company_logo_url?: string | null;
                    location?: string | null;
                    job_type?: string | null;
                    salary_min?: number | null;
                    salary_max?: number | null;
                    salary_currency?: string;
                    description?: string | null;
                    requirements?: any[];
                    responsibilities?: any[];
                    benefits?: any[];
                    application_url?: string | null;
                    source?: string | null;
                    source_job_id?: string | null;
                    posted_date?: string | null;
                    deadline?: string | null;
                    status?: string;
                    embedding?: number[] | null;
                    embedding_status?: string | null;
                    embedded_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    title?: string;
                    company?: string;
                    company_logo_url?: string | null;
                    location?: string | null;
                    job_type?: string | null;
                    salary_min?: number | null;
                    salary_max?: number | null;
                    salary_currency?: string;
                    description?: string | null;
                    requirements?: any[];
                    responsibilities?: any[];
                    benefits?: any[];
                    application_url?: string | null;
                    source?: string | null;
                    source_job_id?: string | null;
                    posted_date?: string | null;
                    deadline?: string | null;
                    status?: string;
                    embedding?: number[] | null;
                    embedding_status?: string | null;
                    embedded_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            applications: {
                Row: {
                    id: string;
                    user_id: string;
                    job_id: string;
                    resume_id: string | null;
                    cover_letter_id: string | null;
                    status: string;
                    applied_at: string | null;
                    response_date: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    job_id: string;
                    resume_id?: string | null;
                    cover_letter_id?: string | null;
                    status?: string;
                    applied_at?: string | null;
                    response_date?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    job_id?: string;
                    resume_id?: string | null;
                    cover_letter_id?: string | null;
                    status?: string;
                    applied_at?: string | null;
                    response_date?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            cover_letters: {
                Row: {
                    id: string;
                    user_id: string;
                    job_id: string | null;
                    title: string;
                    content: string;
                    file_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    job_id?: string | null;
                    title: string;
                    content: string;
                    file_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    job_id?: string | null;
                    title?: string;
                    content?: string;
                    file_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            job_preferences: {
                Row: {
                    id: string;
                    user_id: string;
                    preferred_job_types: any[];
                    preferred_locations: any[];
                    preferred_industries: any[];
                    min_salary: number | null;
                    max_salary: number | null;
                    salary_currency: string;
                    remote_only: boolean;
                    willing_to_relocate: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    preferred_job_types?: any[];
                    preferred_locations?: any[];
                    preferred_industries?: any[];
                    min_salary?: number | null;
                    max_salary?: number | null;
                    salary_currency?: string;
                    remote_only?: boolean;
                    willing_to_relocate?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    preferred_job_types?: any[];
                    preferred_locations?: any[];
                    preferred_industries?: any[];
                    min_salary?: number | null;
                    max_salary?: number | null;
                    salary_currency?: string;
                    remote_only?: boolean;
                    willing_to_relocate?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            job_matches: {
                Row: {
                    id: string;
                    user_id: string;
                    job_id: string;
                    match_score: number | null;
                    matching_skills: any[];
                    missing_skills: any[];
                    ai_analysis: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    job_id: string;
                    match_score?: number | null;
                    matching_skills?: any[];
                    missing_skills?: any[];
                    ai_analysis?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    job_id?: string;
                    match_score?: number | null;
                    matching_skills?: any[];
                    missing_skills?: any[];
                    ai_analysis?: string | null;
                    created_at?: string;
                };
            };
            queue_jobs: {
                Row: {
                    id: number;
                    type: string;
                    payload: Record<string, any>;
                    status: string;
                    attempts: number;
                    max_attempts: number;
                    locked_at: string | null;
                    priority: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    type: string;
                    payload: Record<string, any>;
                    status?: string;
                    attempts?: number;
                    max_attempts?: number;
                    locked_at?: string | null;
                    priority?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    type?: string;
                    payload?: Record<string, any>;
                    status?: string;
                    attempts?: number;
                    max_attempts?: number;
                    locked_at?: string | null;
                    priority?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
}
