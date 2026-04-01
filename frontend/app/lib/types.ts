// SectionConfig type for resume builder form steps
import type { FC } from 'react';
import ProfessionalSummary from '@/components/resume/ProfessionalSummary';
import { Skills } from '@/components/resume/Skills';

// Types for each section of the resume builder form

// Personal Details
export interface PersonalDetailsData {
    jobTitle: string;
    photoUrl?: string; // If you store the uploaded photo
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    cityState: string;
    country: string;
}

// Professional Summary
export type ProfessionalSummaryData = string; // Just the summary text

// Education
export interface EducationEntry {
    id?: number | string; // Optional for new items, can be number (frontend) or string (database UUID)
    dbId?: string; // Database UUID for persisted items
    school: string;
    degree: string;
    startDate: string; // YYYY-MM
    endDate: string;   // YYYY-MM
    location?: string;
    description: string;
}
export type EducationData = EducationEntry[];

// Employment History
export interface EmploymentEntry {
    id?: number | string; // Optional for new items, can be number (frontend) or string (database UUID)
    dbId?: string; // Database UUID for persisted items
    jobTitle: string;
    employer: string;
    startDate: string;
    endDate: string;
    location: string; // Changed from city to location for consistency
    description: string;
}
export type EmploymentHistoryData = EmploymentEntry[];

// Skills
export interface Skill {
    name: string;
    level: number; // 0-100
}
export type SkillsData = Skill[];

// Languages
export type LanguagesData = string[]; // Array of language names

// References
export interface Reference {
    name: string;
    company?: string; // Optional to match database schema
    phone?: string;   // Optional to match database schema
    email?: string;   // Optional to match database schema
}
export interface ReferencesData {
    references: Reference[];
    hideReferences: boolean;
}

// Courses
export interface Course {
    course: string;
    institution: string;
    startDate: string;
    endDate: string;
}
export type CoursesData = Course[];


// Combined resume data type for the entire form
export interface ResumeData {
    personalDetails: PersonalDetailsData;
    professionalSummary: ProfessionalSummaryData;
    education: EducationData;
    employmentHistory: EmploymentHistoryData;
    skills: SkillsData;
    languages: LanguagesData;
    references: ReferencesData;
    courses: CoursesData;
    internships: InternshipsData;
    [sectionName: string]: any;
}

// Initial/default resume data for use in state
export const initialResumeData: ResumeData = {
    personalDetails: {
        jobTitle: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        cityState: '',
        country: '',
        photoUrl: undefined,
    },
    professionalSummary: '',
    education: [],
    employmentHistory: [],
    skills: [],
    languages: [],
    references: {
        references: [],
        hideReferences: true,
    },
    courses: [],
    internships: [],
};

export type SectionConfig =
    | { name: 'Personal Details'; component: React.ComponentType<unknown> }
    | { name: 'Professional Summary'; component: typeof ProfessionalSummary }
    | { name: 'Education'; component: React.ComponentType<unknown> }
    | { name: 'Employment History'; component: React.ComponentType<unknown> }
    | { name: 'Skills'; component: typeof Skills }
    | { name: 'Languages'; component: React.ComponentType<unknown> }
    | { name: 'References'; component: React.ComponentType<unknown> }
    | { name: 'Courses'; component: React.ComponentType<unknown> }
// internships removed

// =====================
// Normalized & JSONB-Compatible Frontend Resume Types (for Supabase/Postgres)
// =====================

// CustomSections type for JSONB (flexible user-defined sections)
export type CustomSections = {
    [sectionName: string]: unknown; // e.g., { "projects": [{...}], "hobbies": ["chess", "coding"] }
};

// Normalized Resume Table (core fields)
export interface ResumeRecord {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    custom_sections?: CustomSections; // JSONB field
}

// Education Table
export interface EducationRecord {
    id: string;
    resume_id: string;
    school: string;
    degree: string;
    start_date: string;
    end_date: string;
    location?: string;
    description?: string;
}

// Experience Table - matches actual database schema
export interface ExperienceRecord {
    id: string;
    resume_id: string;
    employer: string; // Database column name
    jobTitle: string; // Database column name (quoted)
    start_date: string;
    end_date: string;
    location?: string; // Database column name
    description?: string;
}

// Skill Table - matches actual database schema
export interface SkillRecord {
    id: string;
    resume_id: string;
    name: string;
    level: number; // Integer 1-5 in database
}

// Language Table
export interface LanguageRecord {
    id: string;
    resume_id: string;
    name: string;
}

// Reference Table
export interface ReferenceRecord {
    id: string;
    resume_id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
}

// Course Table
export interface CourseRecord {
    id: string;
    resume_id: string;
    course: string;
    institution: string;
    start_date: string;
    end_date: string;
}


// Top-level frontend resume structure for CRUD and UI
export interface FrontendResume {
    resume: ResumeRecord;
    personalDetails: PersonalDetailsData | null;
    education: EducationRecord[];
    experience: ExperienceRecord[];
    skills: SkillRecord[];
    languages: LanguageRecord[];
    references: ReferenceRecord[];
    courses: CourseRecord[];
    // internships removed
    // Optionally, you can include denormalized or UI-only fields here
}

// Re-introduced Internship types for legacy components that import from '@/lib/types'
export interface Internship {
    jobTitle: string;
    employer: string;
    startDate: string;
    endDate: string;
    location: string;
}

export type InternshipsData = Internship[];