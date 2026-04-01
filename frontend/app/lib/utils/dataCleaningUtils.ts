import { ResumeData } from '@/lib/types';
import { fixResumeDataWordSeparation } from './wordSeparationUtils';

/**
 * Comprehensive data cleaning utilities for fixing broken extraction results
 */

export interface CleanedResumeData {
    personalDetails: ResumeData['personalDetails'];
    professionalSummary: string;
    education: ResumeData['education'];
    employmentHistory: ResumeData['employmentHistory'];
    skills: ResumeData['skills'];
    languages: ResumeData['languages'];
    courses: ResumeData['courses'];
    references: ResumeData['references'];
    internships: ResumeData['internships'];
}

/**
 * Clean and reorganize broken resume data
 */
export function cleanBrokenResumeData(brokenData: any): CleanedResumeData {
    const allText = extractAllTextFromBrokenData(brokenData);

    const cleanedData = {
        personalDetails: extractPersonalDetails(allText, brokenData.personalDetails),
        professionalSummary: extractProfessionalSummary(allText),
        education: extractEducation(allText),
        employmentHistory: extractEmploymentHistory(allText),
        skills: extractSkills(allText),
        languages: extractLanguages(allText),
        courses: extractCourses(allText),
        references: extractReferences(allText),
        internships: extractInternships(allText)
    };

    // Apply word separation fixes to the cleaned data
    return fixResumeDataWordSeparation(cleanedData);
}

/**
 * Extract all text from broken data structure
 */
function extractAllTextFromBrokenData(brokenData: any): string {
    const textParts: string[] = [];

    // Extract from skills array (which contains everything)
    if (brokenData.skills && Array.isArray(brokenData.skills)) {
        brokenData.skills.forEach((skill: any) => {
            if (skill.name && typeof skill.name === 'string') {
                textParts.push(skill.name);
            }
        });
    }

    // Extract from other sections
    if (brokenData.professionalSummary) {
        textParts.push(brokenData.professionalSummary);
    }

    if (brokenData.personalDetails) {
        Object.values(brokenData.personalDetails).forEach(value => {
            if (typeof value === 'string' && value.trim()) {
                textParts.push(value);
            }
        });
    }

    return textParts.join(' ');
}

/**
 * Extract and clean personal details
 */
function extractPersonalDetails(allText: string, existingPersonalDetails: any): ResumeData['personalDetails'] {
    const email = extractEmail(allText) || existingPersonalDetails?.email || '';
    const phone = extractPhone(allText) || existingPersonalDetails?.phone || '';
    const name = extractName(allText);
    const location = extractLocation(allText);
    const jobTitle = extractJobTitle(allText);

    return {
        firstName: name.firstName || existingPersonalDetails?.firstName || '',
        lastName: name.lastName || existingPersonalDetails?.lastName || '',
        email: email,
        phone: phone,
        address: location.address || existingPersonalDetails?.address || '',
        cityState: location.cityState || existingPersonalDetails?.cityState || '',
        country: location.country || existingPersonalDetails?.country || '',
        jobTitle: jobTitle || existingPersonalDetails?.jobTitle || '',
        photoUrl: existingPersonalDetails?.photoUrl || ''
    };
}

/**
 * Extract professional summary from text
 */
function extractProfessionalSummary(allText: string): string {
    // Look for professional summary patterns
    const summaryPatterns = [
        /(?:summary|profile|about|overview)[\s:]*([^.!?]*(?:\.|!|\?))/i,
        /(?:experienced|proven|adept|expert|specialist)[^.!?]*(?:\.|!|\?)/i,
        /(?:business|professional|years? of experience)[^.!?]*(?:\.|!|\?)/i
    ];

    for (const pattern of summaryPatterns) {
        const match = allText.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }

    // Fallback: look for long sentences that might be summaries
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 50);
    if (sentences.length > 0) {
        return sentences[0].trim();
    }

    return '';
}

/**
 * Extract education information
 */
function extractEducation(allText: string): ResumeData['education'] {
    const education: ResumeData['education'] = [];

    // Look for university/college patterns
    const universityPattern = /(?:university|college|institute|school)[\s\w]*?(?:\s+in\s+[\w\s]+)?/gi;
    const degreePattern = /(?:bachelor|master|phd|diploma|certificate)[\s\w]*?(?:in\s+[\w\s]+)?/gi;

    const universities = allText.match(universityPattern) || [];
    const degrees = allText.match(degreePattern) || [];

    // Try to match universities with degrees
    for (let i = 0; i < Math.max(universities.length, degrees.length); i++) {
        const school = universities[i]?.trim() || '';
        const degree = degrees[i]?.trim() || '';

        if (school || degree) {
            education.push({
                id: i + 1,
                school: school,
                degree: degree,
                startDate: '',
                endDate: '',
                location: '',
                description: ''
            });
        }
    }

    return education;
}

/**
 * Extract employment history
 */
function extractEmploymentHistory(allText: string): ResumeData['employmentHistory'] {
    const employment: ResumeData['employmentHistory'] = [];

    // Look for job title patterns
    const jobTitlePatterns = [
        /(?:product lead|product manager|software engineer|developer|analyst|consultant|director|manager)[\s\w]*/gi,
        /(?:led|managed|developed|designed|built)[\s\w]*(?:team|project|product|system)/gi
    ];

    const jobTitles: string[] = [];
    jobTitlePatterns.forEach(pattern => {
        const matches = allText.match(pattern) || [];
        jobTitles.push(...matches);
    });

    // Look for company patterns
    const companyPattern = /(?:at\s+)?([A-Z][a-zA-Z\s&]+(?:Inc|Corp|LLC|Ltd|Company|Technologies|Systems|Solutions)?)/g;
    const companies = allText.match(companyPattern) || [];

    // Create employment entries
    for (let i = 0; i < Math.max(jobTitles.length, companies.length); i++) {
        const jobTitle = jobTitles[i]?.trim() || '';
        const company = companies[i]?.trim() || '';

        if (jobTitle || company) {
            employment.push({
                id: i + 1,
                jobTitle: jobTitle,
                employer: company,
                startDate: '',
                endDate: '',
                location: '',
                description: ''
            });
        }
    }

    return employment;
}

/**
 * Extract actual skills (not contaminated data)
 */
function extractSkills(allText: string): ResumeData['skills'] {
    const skills: ResumeData['skills'] = [];

    // Define actual skill categories
    const skillCategories = {
        technical: [
            'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'C#',
            'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
            'Git', 'Linux', 'Windows', 'MacOS', 'HTML', 'CSS', 'SASS', 'LESS'
        ],
        ai: [
            'OpenAI', 'GPT', 'LLM', 'Machine Learning', 'AI', 'ML', 'Deep Learning',
            'TensorFlow', 'PyTorch', 'Natural Language Processing', 'NLP',
            'Computer Vision', 'Data Science', 'Analytics'
        ],
        business: [
            'Product Management', 'Project Management', 'Agile', 'Scrum', 'Kanban',
            'Business Analysis', 'Stakeholder Management', 'Strategic Planning',
            'Market Research', 'Competitive Analysis', 'ROI Analysis'
        ],
        tools: [
            'Figma', 'Sketch', 'Adobe Creative Suite', 'Jira', 'Confluence',
            'Slack', 'Microsoft Office', 'Google Workspace', 'Salesforce',
            'HubSpot', 'Tableau', 'Power BI'
        ]
    };

    // Check for each skill in the text
    Object.values(skillCategories).flat().forEach(skill => {
        if (allText.toLowerCase().includes(skill.toLowerCase())) {
            skills.push({
                name: skill,
                level: 70 // Default level for detected skills
            });
        }
    });

    // Remove duplicates
    const uniqueSkills = skills.filter((skill, index, self) =>
        index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase())
    );

    return uniqueSkills;
}

/**
 * Extract languages
 */
function extractLanguages(allText: string): ResumeData['languages'] {
    const languages: string[] = [];

    const languagePatterns = [
        /(?:english|spanish|french|german|italian|portuguese|chinese|japanese|korean|arabic|hindi|russian)/gi
    ];

    languagePatterns.forEach(pattern => {
        const matches = allText.match(pattern) || [];
        matches.forEach(match => {
            const lang = match.toLowerCase();
            if (!languages.includes(lang)) {
                languages.push(lang);
            }
        });
    });

    return languages;
}

/**
 * Extract courses
 */
function extractCourses(allText: string): ResumeData['courses'] {
    // For now, return empty array as courses are rarely mentioned in resumes
    return [];
}

/**
 * Extract references
 */
function extractReferences(allText: string): ResumeData['references'] {
    return {
        hideReferences: true,
        references: []
    };
}

/**
 * Extract internships
 */
function extractInternships(allText: string): ResumeData['internships'] {
    // For now, return empty array
    return [];
}

/**
 * Helper function to extract email
 */
function extractEmail(text: string): string | null {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailPattern);
    return match ? match[0] : null;
}

/**
 * Helper function to extract phone
 */
function extractPhone(text: string): string | null {
    const phonePattern = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const match = text.match(phonePattern);
    return match ? match[0] : null;
}

/**
 * Helper function to extract name
 */
function extractName(text: string): { firstName: string; lastName: string } {
    // Look for name patterns at the beginning of text
    const namePattern = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)/;
    const match = text.match(namePattern);

    if (match) {
        return {
            firstName: match[1],
            lastName: match[2]
        };
    }

    return { firstName: '', lastName: '' };
}

/**
 * Helper function to extract location
 */
function extractLocation(text: string): { address: string; cityState: string; country: string } {
    const locationPatterns = [
        /(?:Lagos|Nigeria|New York|California|Texas|London|Paris|Berlin)/gi
    ];

    const locations: string[] = [];
    locationPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        locations.push(...matches);
    });

    const cityState = locations.slice(0, 2).join(', ');
    const country = locations[locations.length - 1] || '';

    return {
        address: '',
        cityState: cityState,
        country: country
    };
}

/**
 * Helper function to extract job title
 */
function extractJobTitle(text: string): string {
    const jobTitlePatterns = [
        /(?:product lead|product manager|software engineer|developer|analyst|consultant|director|manager)[\s\w]*/i,
        /(?:senior|junior|lead|principal|staff)\s+(?:software|product|business|data|marketing|sales)[\s\w]*/i
    ];

    for (const pattern of jobTitlePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }

    return '';
}
