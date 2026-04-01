// Types for the resume builder system

// Section data types
export interface PersonalDetailsData {
    jobTitle: string;
    photoUrl?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    cityState: string;
    country: string;
}

export type ProfessionalSummaryData = string;

export interface EducationEntry {
    id?: number | string;
    school: string;
    degree: string;
    startDate: string; // YYYY-MM
    endDate: string;   // YYYY-MM
    location?: string;
    description: string;
}

export type EducationData = EducationEntry[];

export interface EmploymentEntry {
    id?: number | string;
    jobTitle: string;
    employer: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
}

export type EmploymentHistoryData = EmploymentEntry[];

export interface Skill {
    name: string;
    level: number; // 0-100
}

export type SkillsData = Skill[];

export type LanguagesData = string[];

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

export interface Course {
    course: string;
    institution: string;
    startDate: string;
    endDate: string;
}

export type CoursesData = Course[];

export interface Internship {
    jobTitle: string;
    employer: string;
    startDate: string;
    endDate: string;
    location: string;
}

export type InternshipsData = Internship[];

// Combined resume data type
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
}

// Initial/default resume data
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

// Template types
export interface Template {
    id: string;
    uuid: string;
    name: string;
    description: string;
    image: string;
    categories: string[];
}

// Section configuration for form steps
import type { FC } from 'react';
import ProfessionalSummary from '@/components/resume/ProfessionalSummary';
import { Skills } from '@/components/resume/Skills';

export type SectionConfig =
    | { name: 'Personal Details'; component: React.ComponentType<unknown> }
    | { name: 'Professional Summary'; component: typeof ProfessionalSummary }
    | { name: 'Education'; component: React.ComponentType<unknown> }
    | { name: 'Employment History'; component: React.ComponentType<unknown> }
    | { name: 'Skills'; component: typeof Skills }
    | { name: 'Languages'; component: React.ComponentType<unknown> }
    | { name: 'References'; component: React.ComponentType<unknown> }
    | { name: 'Courses'; component: React.ComponentType<unknown> }
    | { name: 'Internships'; component: React.ComponentType<unknown> };

// Normalized database record types
export type CustomSections = {
    [sectionName: string]: unknown;
};

export interface ResumeRecord {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    custom_sections?: CustomSections;
    template_id: string | null;
    template_name: string | null;
    color: string | null;
}

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

export interface ExperienceRecord {
    id: string;
    resume_id: string;
    employer: string;
    jobTitle: string; // Updated to match actual database
    start_date: string;
    end_date: string;
    location?: string;
    description?: string;
}

export interface SkillRecord {
    id: string;
    resume_id: string;
    name: string;
    level: number; // Integer 1-5 to match database constraint
}

export interface LanguageRecord {
    id: string;
    resume_id: string;
    name: string;
}

export interface ReferenceRecord {
    id: string;
    resume_id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
}

export interface CourseRecord {
    id: string;
    resume_id: string;
    name: string;
    institution: string;
    start_date: string;
    end_date: string;
}

export interface InternshipRecord {
    id: string;
    resume_id: string;
    position: string;
    employer: string;
    start_date: string;
    end_date: string;
    location?: string;
}

export interface FrontendResume {
    resume: ResumeRecord;
    personalDetails: PersonalDetailsData | null;
    education: EducationRecord[];
    experience: ExperienceRecord[];
    skills: SkillRecord[];
    languages: LanguageRecord[];
    references: ReferenceRecord[];
    courses: CourseRecord[];
    internships: InternshipRecord[];
}

// Service interfaces
export interface CreateResumeParams {
    title: string;
    userId: string;
    templateId?: string;
    templateName?: string;
    color?: string;
}

export interface UpdateResumeParams {
    id: string;
    title?: string;
    templateId?: string;
    templateName?: string;
    color?: string;
    customSections?: CustomSections;
}

export interface SyncResumeParams {
    resumeId: string;
    data: ResumeData;
}

export interface TemplateSelectionParams {
    templateId: string;
    color: string;
    userId: string;
}

// Repository interfaces
export interface ResumeRepository {
    create: (params: CreateResumeParams) => Promise<ResumeRecord>;
    update: (id: string, params: UpdateResumeParams) => Promise<ResumeRecord>;
    delete: (id: string) => Promise<boolean>;
    getById: (id: string) => Promise<ResumeRecord | null>;
    getByUserId: (userId: string) => Promise<ResumeRecord[]>;
}

export interface SectionRepository<T> {
    getByResumeId: (resumeId: string) => Promise<T[]>;
    deleteByResumeId: (resumeId: string) => Promise<void>;
    create: (items: T[]) => Promise<T[]>;
}

export interface TemplateRepository {
    getAll: () => Promise<Template[]>;
    getById: (id: string) => Promise<Template | null>;
    getByUuid: (uuid: string) => Promise<Template | null>;
}

// Service interfaces
export interface ResumeService {
    createResume: (params: CreateResumeParams) => Promise<ResumeRecord>;
    updateResume: (id: string, params: UpdateResumeParams) => Promise<ResumeRecord>;
    deleteResume: (id: string) => Promise<boolean>;
    loadResume: (id: string) => Promise<FrontendResume | null>;
    syncResume: (params: SyncResumeParams) => Promise<void>;
}

export interface TemplateService {
    getTemplates: () => Promise<Template[]>;
    getTemplateById: (id: string) => Promise<Template | null>;
    getTemplateByUuid: (uuid: string) => Promise<Template | null>;
    applyTemplate: (params: TemplateSelectionParams) => Promise<ResumeRecord>;
}

// Orchestrator interfaces
export interface ResumeOrchestrator {
    createNewResume: (params: CreateResumeParams) => Promise<ResumeRecord>;
    loadResumeForEditing: (id: string, userId: string) => Promise<FrontendResume | null>;
    saveResumeChanges: (params: SyncResumeParams) => Promise<void>;
    changeTemplate: (resumeId: string, templateParams: TemplateSelectionParams) => Promise<ResumeRecord>;
}
