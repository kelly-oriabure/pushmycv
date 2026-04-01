import { createHash } from 'crypto';
import { ResumeData } from '@/lib/types';

/**
 * Generate a consistent SHA-256 hash from custom_sections JSONB data
 * This enables change tracking, duplicate detection, and sync management
 */
export function generateCustomSectionsHash(customSections: any): string {
    if (!customSections || typeof customSections !== 'object') {
        return createHash('sha256').update('').digest('hex');
    }

    // Normalize the JSONB data for consistent hashing
    // This ensures the same data always produces the same hash regardless of:
    // - Property order
    // - Array element order (where applicable)
    // - Whitespace differences
    const normalized = {
        personalDetails: normalizePersonalDetails(customSections.personalDetails || {}),
        professionalSummary: (customSections.professionalSummary || '').trim(),
        education: normalizeEducationArray(customSections.education || []),
        employmentHistory: normalizeEmploymentArray(customSections.employmentHistory || []),
        skills: normalizeSkillsArray(customSections.skills || []),
        languages: normalizeLanguagesArray(customSections.languages || []),
        courses: normalizeCoursesArray(customSections.courses || []),
        references: normalizeReferences(customSections.references || { hideReferences: true, references: [] }),
        internships: normalizeInternshipsArray(customSections.internships || [])
    };

    // Generate hash from normalized data
    return createHash('sha256')
        .update(JSON.stringify(normalized))
        .digest('hex');
}

/**
 * Normalize personal details for consistent hashing
 */
function normalizePersonalDetails(personalDetails: any): any {
    return {
        firstName: (personalDetails.firstName || '').trim(),
        lastName: (personalDetails.lastName || '').trim(),
        email: (personalDetails.email || '').trim().toLowerCase(),
        phone: (personalDetails.phone || '').trim(),
        address: (personalDetails.address || '').trim(),
        cityState: (personalDetails.cityState || '').trim(),
        country: (personalDetails.country || '').trim(),
        jobTitle: (personalDetails.jobTitle || '').trim(),
        photoUrl: (personalDetails.photoUrl || '').trim()
    };
}

/**
 * Normalize education array for consistent hashing
 */
function normalizeEducationArray(education: any[]): any[] {
    return education
        .map(edu => ({
            school: (edu.school || '').trim(),
            degree: (edu.degree || '').trim(),
            startDate: (edu.startDate || '').trim(),
            endDate: (edu.endDate || '').trim(),
            location: (edu.location || '').trim(),
            description: (edu.description || '').trim()
        }))
        .sort((a, b) => {
            // Sort by school name, then by degree
            const schoolCompare = a.school.localeCompare(b.school);
            if (schoolCompare !== 0) return schoolCompare;
            return a.degree.localeCompare(b.degree);
        });
}

/**
 * Normalize employment history array for consistent hashing
 */
function normalizeEmploymentArray(employment: any[]): any[] {
    return employment
        .map(emp => ({
            jobTitle: (emp.jobTitle || '').trim(),
            employer: (emp.employer || '').trim(),
            startDate: (emp.startDate || '').trim(),
            endDate: (emp.endDate || '').trim(),
            location: (emp.location || '').trim(),
            description: (emp.description || '').trim()
        }))
        .sort((a, b) => {
            // Sort by employer name, then by job title
            const employerCompare = a.employer.localeCompare(b.employer);
            if (employerCompare !== 0) return employerCompare;
            return a.jobTitle.localeCompare(b.jobTitle);
        });
}

/**
 * Normalize skills array for consistent hashing
 */
function normalizeSkillsArray(skills: any[]): any[] {
    return skills
        .map(skill => ({
            name: (skill.name || '').trim(),
            level: typeof skill.level === 'number' ? skill.level : 20
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Normalize languages array for consistent hashing
 */
function normalizeLanguagesArray(languages: any[]): string[] {
    return languages
        .map(lang => {
            // Handle both string and object formats
            const name = typeof lang === 'string' ? lang : (lang.name || '');
            return name.trim();
        })
        .filter(lang => lang.length > 0)
        .sort();
}

/**
 * Normalize courses array for consistent hashing
 */
function normalizeCoursesArray(courses: any[]): any[] {
    return courses
        .map(course => ({
            course: (course.course || course.name || '').trim(),
            institution: (course.institution || '').trim(),
            startDate: (course.startDate || '').trim(),
            endDate: (course.endDate || '').trim()
        }))
        .sort((a, b) => {
            // Sort by institution, then by course name
            const institutionCompare = a.institution.localeCompare(b.institution);
            if (institutionCompare !== 0) return institutionCompare;
            return a.course.localeCompare(b.course);
        });
}

/**
 * Normalize references for consistent hashing
 */
function normalizeReferences(references: any): any {
    return {
        hideReferences: Boolean(references.hideReferences),
        references: (references.references || [])
            .map((ref: any) => ({
                name: (ref.name || '').trim(),
                company: (ref.company || '').trim(),
                phone: (ref.phone || '').trim(),
                email: (ref.email || '').trim().toLowerCase()
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
    };
}

/**
 * Normalize internships array for consistent hashing
 */
function normalizeInternshipsArray(internships: any[]): any[] {
    return internships
        .map(internship => {
            // Handle various internship formats
            if (typeof internship === 'string') {
                return { name: internship.trim() };
            }
            return {
                name: (internship.name || internship.title || '').trim(),
                company: (internship.company || '').trim(),
                startDate: (internship.startDate || '').trim(),
                endDate: (internship.endDate || '').trim(),
                description: (internship.description || '').trim()
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Compare two custom_sections hashes to detect changes
 */
export function hasCustomSectionsChanged(oldHash: string | null, newHash: string): boolean {
    if (!oldHash) return true; // No previous hash means it's a change
    return oldHash !== newHash;
}

/**
 * Generate hash from ResumeData object
 */
export function generateResumeDataHash(resumeData: ResumeData): string {
    return generateCustomSectionsHash(resumeData);
}






