import { PdfTextExtractionResult } from '@/lib/pdfTextExtractor';
import { ResumeData } from '@/lib/types';
import { fixResumeDataWordSeparation } from '@/lib/utils/wordSeparationUtils';

export interface ExtractedResumeData {
    personalDetails: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        cityState: string;
        country: string;
        jobTitle: string;
        photoUrl: string;
    };
    professionalSummary: string;
    education: Array<{
        school: string;
        degree: string;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
    }>;
    employmentHistory: Array<{
        jobTitle: string;
        employer: string;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
    }>;
    skills: Array<{
        name: string;
        level: number;
    }>;
    languages: string[];
    courses: Array<{
        course: string;
        institution: string;
        startDate: string;
        endDate: string;
    }>;
    references: {
        hideReferences: boolean;
        references: Array<{
            name: string;
            company: string;
            phone: string;
            email: string;
        }>;
    };
    internships: any[];
}

export async function extractResumeDataFromText(
    extractedData: PdfTextExtractionResult
): Promise<Partial<ResumeData>> {
    const { fullText, contactInfo } = extractedData;

    // Extract personal details from contact info and text
    const personalDetails = extractPersonalDetails(fullText, contactInfo);

    // Extract professional summary
    const professionalSummary = extractProfessionalSummary(fullText);

    // Extract education
    const education = extractEducation(fullText);

    // Extract employment history
    const employmentHistory = extractEmploymentHistory(fullText);

    // Extract skills
    const skills = extractSkills(fullText);

    // Extract languages
    const languages = extractLanguages(fullText);

    // Extract courses
    const courses = extractCourses(fullText);

    // Initialize references
    const references = {
        hideReferences: true,
        references: []
    };

    // Initialize internships
    const internships: any[] = [];

    const resumeData = {
        personalDetails,
        professionalSummary,
        education,
        employmentHistory,
        skills,
        languages,
        courses,
        references,
        internships
    };

    // Apply word separation fixes to the extracted data
    return fixResumeDataWordSeparation(resumeData);
}

function extractPersonalDetails(fullText: string, contactInfo: any) {
    // Extract name from text (usually at the top)
    const nameMatch = fullText.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)/m);
    const firstName = nameMatch ? nameMatch[1] : '';
    const lastName = nameMatch ? nameMatch[2] : '';

    // Extract job title (look for common patterns)
    const jobTitleMatch = fullText.match(/(?:title|position|role):\s*([^\n]+)/i) ||
        fullText.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s*([^\n]+)/m);
    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : '';

    // Extract address (look for street address patterns)
    const addressMatch = fullText.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd))/i);
    const address = addressMatch ? addressMatch[1] : '';

    // Extract city, state (look for common patterns)
    const cityStateMatch = fullText.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*\d{5}/i) ||
        fullText.match(/([A-Za-z\s]+),\s*([A-Za-z\s]+)/i);
    const cityState = cityStateMatch ? `${cityStateMatch[1]}, ${cityStateMatch[2]}` : '';

    return {
        firstName,
        lastName,
        email: contactInfo.emails?.[0] || '',
        phone: contactInfo.phones?.[0] || '',
        address,
        cityState,
        country: 'USA', // Default to USA, could be enhanced
        jobTitle,
        photoUrl: ''
    };
}

function extractProfessionalSummary(fullText: string): string {
    // Look for summary section
    const summaryPatterns = [
        /(?:summary|profile|objective|about):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i,
        /(?:professional\s+summary|career\s+summary):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i,
        /(?:executive\s+summary):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i
    ];

    for (const pattern of summaryPatterns) {
        const match = fullText.match(pattern);
        if (match) {
            return match[1].trim().replace(/\s+/g, ' ');
        }
    }

    // If no explicit summary, take first paragraph after name
    const lines = fullText.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
        const firstParagraph = lines[1];
        if (firstParagraph.length > 50 && !firstParagraph.match(/^\d/)) {
            return firstParagraph.trim();
        }
    }

    return '';
}

function extractEducation(fullText: string) {
    const education: Array<{
        school: string;
        degree: string;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
    }> = [];

    // Look for education section
    const educationSection = extractSection(fullText, ['education', 'academic', 'qualifications']);

    if (educationSection) {
        // Split by common separators
        const entries = educationSection.split(/\n\s*\n/).filter(entry => entry.trim());

        for (const entry of entries) {
            const lines = entry.split('\n').map(line => line.trim()).filter(line => line);

            if (lines.length >= 2) {
                const school = lines[0];
                const degree = lines[1];

                // Extract dates
                const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|\w+)/);
                const startDate = dateMatch ? `${dateMatch[1]}-01` : '';
                const endDate = dateMatch ? (dateMatch[2].length === 4 ? `${dateMatch[2]}-12` : '') : '';

                // Extract location
                const locationMatch = entry.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)/);
                const location = locationMatch ? locationMatch[1] : '';

                education.push({
                    school,
                    degree,
                    startDate,
                    endDate,
                    location,
                    description: lines.slice(2).join(' ')
                });
            }
        }
    }

    return education;
}

function extractEmploymentHistory(fullText: string) {
    const employment: Array<{
        jobTitle: string;
        employer: string;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
    }> = [];

    // Look for experience section
    const experienceSection = extractSection(fullText, ['experience', 'employment', 'work history', 'professional experience']);

    if (experienceSection) {
        // Split by common separators
        const entries = experienceSection.split(/\n\s*\n/).filter(entry => entry.trim());

        for (const entry of entries) {
            const lines = entry.split('\n').map(line => line.trim()).filter(line => line);

            if (lines.length >= 2) {
                const jobTitle = lines[0];
                const employer = lines[1];

                // Extract dates
                const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|\w+)/);
                const startDate = dateMatch ? `${dateMatch[1]}-01` : '';
                const endDate = dateMatch ? (dateMatch[2].length === 4 ? `${dateMatch[2]}-12` : '') : '';

                // Extract location
                const locationMatch = entry.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)/);
                const location = locationMatch ? locationMatch[1] : '';

                employment.push({
                    jobTitle,
                    employer,
                    startDate,
                    endDate,
                    location,
                    description: lines.slice(2).join(' ')
                });
            }
        }
    }

    return employment;
}

function extractSkills(fullText: string) {
    const skills: Array<{ name: string; level: number }> = [];

    // Look for skills section
    const skillsSection = extractSection(fullText, ['skills', 'technical skills', 'core competencies', 'expertise']);

    if (skillsSection) {
        // Clean the skills section - remove contact info, education, etc.
        const cleanedSection = cleanSkillsSection(skillsSection);

        // Extract skills using more specific patterns
        const skillPatterns = [
            // Comma-separated skills
            /([A-Za-z\s#+\.]+)(?:\s*,\s*)/g,
            // Bullet point skills
            /(?:^|\n)\s*[•\-\*]\s*([A-Za-z\s#+\.]+)/gm,
            // Skills with percentages
            /([A-Za-z\s#+\.]+)(?:\s*[-–]\s*(\d+)%)?/g
        ];

        for (const pattern of skillPatterns) {
            let match;
            while ((match = pattern.exec(cleanedSection)) !== null) {
                const skillName = match[1].trim();
                const level = match[2] ? parseInt(match[2]) : 50;

                // Validate that this is actually a skill, not contact info or other data
                if (isValidSkill(skillName)) {
                    skills.push({ name: skillName, level });
                }
            }
        }
    }

    // If no skills section found, look for common technical terms throughout the document
    if (skills.length === 0) {
        const commonSkills = [
            'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'TypeScript', 'SQL', 'HTML', 'CSS',
            'Git', 'Docker', 'AWS', 'Azure', 'Linux', 'Windows', 'Agile', 'Scrum', 'MongoDB', 'PostgreSQL',
            'Express', 'Vue.js', 'Angular', 'Spring', 'Django', 'Flask', 'REST API', 'GraphQL'
        ];

        for (const skill of commonSkills) {
            if (fullText.toLowerCase().includes(skill.toLowerCase())) {
                skills.push({ name: skill, level: 50 });
            }
        }
    }

    // Remove duplicates
    const uniqueSkills = skills.filter((skill, index, self) =>
        index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase())
    );

    return uniqueSkills;
}

/**
 * Clean skills section by removing non-skill content
 */
function cleanSkillsSection(skillsSection: string): string {
    // Remove contact information patterns
    const cleaned = skillsSection
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '') // Remove emails
        .replace(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, '') // Remove phones
        .replace(/www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '') // Remove websites
        .replace(/linkedin\.com\/in\/[a-zA-Z0-9-]+/g, '') // Remove LinkedIn profiles
        .replace(/github\.com\/[a-zA-Z0-9-]+/g, '') // Remove GitHub profiles
        .replace(/(?:university|college|institute|school)[\s\w]*/gi, '') // Remove education references
        .replace(/(?:bachelor|master|phd|diploma|certificate)[\s\w]*/gi, '') // Remove degree references
        .replace(/(?:years? of experience|experience|years?)/gi, '') // Remove experience references
        .replace(/(?:reference|references|available upon request)/gi, '') // Remove reference text
        .replace(/\b(?:Lagos|Nigeria|New York|California|Texas|London|Paris|Berlin)\b/gi, '') // Remove location names
        .replace(/\b(?:gmail|yahoo|hotmail|outlook)\.com\b/gi, '') // Remove email providers
        .replace(/\b(?:linkedin|github|twitter|facebook|instagram)\b/gi, ''); // Remove social media

    return cleaned;
}

/**
 * Validate if a string is actually a skill
 */
function isValidSkill(skillName: string): boolean {
    // Must be between 2 and 30 characters
    if (skillName.length < 2 || skillName.length > 30) {
        return false;
    }

    // Must not contain certain patterns that indicate it's not a skill
    const invalidPatterns = [
        /@/, // Contains @ (email)
        /\+/, // Contains + (phone)
        /www\./, // Contains www (website)
        /linkedin/, // Contains linkedin
        /github/, // Contains github
        /gmail|yahoo|hotmail/, // Contains email providers
        /university|college|institute|school/, // Contains education terms
        /bachelor|master|phd|diploma|certificate/, // Contains degree terms
        /years? of experience|experience|years?/, // Contains experience terms
        /reference|references/, // Contains reference terms
        /Lagos|Nigeria|New York|California|Texas|London|Paris|Berlin/, // Contains location names
        /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // Looks like a name (First Last)
        /^\d+$/, // Is just numbers
        /^[a-z]+$/, // Is all lowercase (likely not a proper skill name)
        /[A-Z]{3,}/, // Contains too many consecutive capitals (likely acronyms that aren't skills)
    ];

    for (const pattern of invalidPatterns) {
        if (pattern.test(skillName)) {
            return false;
        }
    }

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(skillName)) {
        return false;
    }

    return true;
}

function extractLanguages(fullText: string): string[] {
    const languages: string[] = [];

    // Look for languages section
    const languagesSection = extractSection(fullText, ['languages', 'language skills']);

    if (languagesSection) {
        const languagePattern = /([A-Za-z\s]+)(?:\s*[-–]\s*(?:native|fluent|intermediate|basic))?/gi;
        let match;

        while ((match = languagePattern.exec(languagesSection)) !== null) {
            const language = match[1].trim();
            if (language.length > 1 && language.length < 20) {
                languages.push(language);
            }
        }
    }

    // Default languages if none found
    if (languages.length === 0) {
        languages.push('English');
    }

    return languages;
}

function extractCourses(fullText: string) {
    const courses: Array<{
        course: string;
        institution: string;
        startDate: string;
        endDate: string;
    }> = [];

    // Look for courses section
    const coursesSection = extractSection(fullText, ['courses', 'certifications', 'training']);

    if (coursesSection) {
        const entries = coursesSection.split(/\n/).filter(entry => entry.trim());

        for (const entry of entries) {
            const lines = entry.split(' - ').map(line => line.trim());

            if (lines.length >= 2) {
                courses.push({
                    course: lines[0],
                    institution: lines[1],
                    startDate: '',
                    endDate: ''
                });
            }
        }
    }

    return courses;
}

function extractSection(fullText: string, sectionNames: string[]): string | null {
    for (const sectionName of sectionNames) {
        const pattern = new RegExp(`${sectionName}[\\s\\S]*?(?=\\n\\n[A-Z]|$)`, 'i');
        const match = fullText.match(pattern);

        if (match) {
            return match[0].replace(new RegExp(`^${sectionName}\\s*:?\\s*`, 'i'), '').trim();
        }
    }

    return null;
}
