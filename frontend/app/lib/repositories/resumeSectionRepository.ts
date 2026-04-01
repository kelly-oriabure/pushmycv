import { SupabaseClient } from '@supabase/supabase-js';
import type { ResumeData } from '@/lib/types';

/**
 * Repository for syncing resume form sections to normalized database tables
 * Handles individual section syncing to avoid race conditions
 */
export class ResumeSectionRepository {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Sync personal details to resume_personal_details table
     */
    async syncPersonalDetails(resumeId: string, personalDetails: ResumeData['personalDetails']): Promise<void> {
        const { error } = await this.supabase
            .from('resume_personal_details')
            .upsert({
                resume_id: resumeId,
                job_title: personalDetails.jobTitle || null,
                photo_url: personalDetails.photoUrl || null,
                first_name: personalDetails.firstName || '',
                last_name: personalDetails.lastName || '',
                email: personalDetails.email || '',
                phone: personalDetails.phone || '',
                address: personalDetails.address || null,
                city_state: personalDetails.cityState || null,
                country: personalDetails.country || null,
            }, {
                onConflict: 'resume_id'
            });

        if (error) {
            throw new Error(`Failed to sync personal details: ${error.message}`);
        }
    }

    /**
     * Sync professional summary to resume_professional_summary table
     */
    async syncProfessionalSummary(resumeId: string, summary: string): Promise<void> {
        const { error } = await this.supabase
            .from('resume_professional_summary')
            .upsert({
                resume_id: resumeId,
                summary: summary || '',
            }, {
                onConflict: 'resume_id'
            });

        if (error) {
            throw new Error(`Failed to sync professional summary: ${error.message}`);
        }
    }

    /**
     * Sync education entries to resume_education table
     */
    async syncEducation(resumeId: string, education: ResumeData['education']): Promise<void> {
        // Delete existing entries first (to handle removals)
        await this.supabase
            .from('resume_education')
            .delete()
            .eq('resume_id', resumeId);

        if (education.length === 0) {
            return; // No entries to insert
        }

        // Insert new entries
        const entries = education.map((edu, index) => ({
            resume_id: resumeId,
            school: edu.school || '',
            degree: edu.degree || '',
            start_date: edu.startDate || '',
            end_date: edu.endDate || '',
            location: edu.location || null,
            description: edu.description || null,
            display_order: index,
        }));

        const { error } = await this.supabase
            .from('resume_education')
            .insert(entries);

        if (error) {
            throw new Error(`Failed to sync education: ${error.message}`);
        }
    }

    /**
     * Sync employment history to resume_employment_history table
     */
    async syncEmploymentHistory(resumeId: string, employmentHistory: ResumeData['employmentHistory']): Promise<void> {
        // Delete existing entries first
        await this.supabase
            .from('resume_employment_history')
            .delete()
            .eq('resume_id', resumeId);

        if (employmentHistory.length === 0) {
            return;
        }

        const entries = employmentHistory.map((exp, index) => ({
            resume_id: resumeId,
            job_title: exp.jobTitle || '',
            employer: exp.employer || '',
            start_date: exp.startDate || '',
            end_date: exp.endDate || '',
            location: exp.location || null,
            description: exp.description || null,
            display_order: index,
        }));

        const { error } = await this.supabase
            .from('resume_employment_history')
            .insert(entries);

        if (error) {
            throw new Error(`Failed to sync employment history: ${error.message}`);
        }
    }

    /**
     * Sync skills to resume_skills table
     */
    async syncSkills(resumeId: string, skills: ResumeData['skills']): Promise<void> {
        // Delete existing entries first
        await this.supabase
            .from('resume_skills')
            .delete()
            .eq('resume_id', resumeId);

        if (skills.length === 0) {
            return;
        }

        const entries = skills.map((skill, index) => ({
            resume_id: resumeId,
            name: skill.name || '',
            level: skill.level ?? 100,
            display_order: index,
        }));

        const { error } = await this.supabase
            .from('resume_skills')
            .insert(entries);

        if (error) {
            throw new Error(`Failed to sync skills: ${error.message}`);
        }
    }

    /**
     * Sync languages to resume_languages table
     */
    async syncLanguages(resumeId: string, languages: ResumeData['languages']): Promise<void> {
        // Delete existing entries first
        await this.supabase
            .from('resume_languages')
            .delete()
            .eq('resume_id', resumeId);

        if (languages.length === 0) {
            return;
        }

        const entries = languages.map((lang, index) => ({
            resume_id: resumeId,
            name: lang || '',
            display_order: index,
        }));

        const { error } = await this.supabase
            .from('resume_languages')
            .insert(entries);

        if (error) {
            throw new Error(`Failed to sync languages: ${error.message}`);
        }
    }

    /**
     * Sync references to resume_references table
     */
    async syncReferences(resumeId: string, references: ResumeData['references']): Promise<void> {
        // Delete existing entries first
        await this.supabase
            .from('resume_references')
            .delete()
            .eq('resume_id', resumeId);

        // Sync references settings
        await this.supabase
            .from('resume_references_settings')
            .upsert({
                resume_id: resumeId,
                hide_references: references.hideReferences ?? false,
            }, {
                onConflict: 'resume_id'
            });

        if (references.references.length === 0) {
            return;
        }

        const entries = references.references.map((ref, index) => ({
            resume_id: resumeId,
            name: ref.name || '',
            company: ref.company || null,
            phone: ref.phone || null,
            email: ref.email || null,
            display_order: index,
        }));

        const { error } = await this.supabase
            .from('resume_references')
            .insert(entries);

        if (error) {
            throw new Error(`Failed to sync references: ${error.message}`);
        }
    }

    /**
     * Sync courses to resume_courses table
     */
    async syncCourses(resumeId: string, courses: ResumeData['courses']): Promise<void> {
        // Delete existing entries first
        await this.supabase
            .from('resume_courses')
            .delete()
            .eq('resume_id', resumeId);

        if (courses.length === 0) {
            return;
        }

        const entries = courses.map((course, index) => ({
            resume_id: resumeId,
            course: course.course || '',
            institution: course.institution || '',
            start_date: course.startDate || '',
            end_date: course.endDate || '',
            display_order: index,
        }));

        const { error } = await this.supabase
            .from('resume_courses')
            .insert(entries);

        if (error) {
            throw new Error(`Failed to sync courses: ${error.message}`);
        }
    }

    /**
     * Sync a specific section by name
     */
    async syncSection(resumeId: string, section: keyof ResumeData, data: ResumeData[keyof ResumeData]): Promise<void> {
        switch (section) {
            case 'personalDetails':
                await this.syncPersonalDetails(resumeId, data as ResumeData['personalDetails']);
                break;
            case 'professionalSummary':
                await this.syncProfessionalSummary(resumeId, data as string);
                break;
            case 'education':
                await this.syncEducation(resumeId, data as ResumeData['education']);
                break;
            case 'employmentHistory':
                await this.syncEmploymentHistory(resumeId, data as ResumeData['employmentHistory']);
                break;
            case 'skills':
                await this.syncSkills(resumeId, data as ResumeData['skills']);
                break;
            case 'languages':
                await this.syncLanguages(resumeId, data as ResumeData['languages']);
                break;
            case 'references':
                await this.syncReferences(resumeId, data as ResumeData['references']);
                break;
            case 'courses':
                await this.syncCourses(resumeId, data as ResumeData['courses']);
                break;
            case 'internships':
                // Internships not yet implemented in tables
                break;
            default:
                console.warn(`Unknown section: ${section}`);
        }
    }
}

