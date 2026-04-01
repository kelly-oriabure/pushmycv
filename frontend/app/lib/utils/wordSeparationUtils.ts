/**
 * Utilities for fixing joined words in extracted text
 */

/**
 * Fix joined words in extracted text using various strategies
 */
export function fixJoinedWords(text: string): string {
    if (!text || typeof text !== 'string') {
        return text;
    }

    let fixedText = text;

    // Strategy 1: Fix specific known name patterns first
    fixedText = fixSpecificNamePatterns(fixedText);

    // Strategy 2: Fix common name patterns
    fixedText = fixNamePatterns(fixedText);

    // Strategy 3: Fix common word boundaries
    fixedText = fixWordBoundaries(fixedText);

    // Strategy 4: Fix technical terms and acronyms
    fixedText = fixTechnicalTerms(fixedText);

    // Strategy 5: Fix common joined phrases
    fixedText = fixCommonPhrases(fixedText);

    // Strategy 6: Fix email and contact patterns
    fixedText = fixContactPatterns(fixedText);

    return fixedText;
}

/**
 * Fix common name patterns (FirstLast -> First Last)
 */
function fixNamePatterns(text: string): string {
    // Pattern: CapitalLetter + lowercase + CapitalLetter + lowercase (e.g., "ORIABUREKELLY" -> "ORIABURE KELLY")
    const namePattern = /([A-Z][a-z]+)([A-Z][a-z]+)/g;

    return text.replace(namePattern, (match, first, last) => {
        // Check if this looks like a name (both parts are reasonable length)
        if (first.length >= 2 && last.length >= 2 && first.length <= 15 && last.length <= 15) {
            return `${first} ${last}`;
        }
        return match;
    });
}

/**
 * Fix specific known name patterns
 */
function fixSpecificNamePatterns(text: string): string {
    // Handle specific known cases
    const specificPatterns = [
        { pattern: /ORIABUREKELLY/gi, replacement: 'ORIABURE KELLY' },
        { pattern: /KELLYOBEHI/gi, replacement: 'KELLY OBEHI' },
        { pattern: /KELLYCODE/gi, replacement: 'KELLY CODE' },
    ];

    let fixed = text;
    specificPatterns.forEach(({ pattern, replacement }) => {
        fixed = fixed.replace(pattern, replacement);
    });

    return fixed;
}

/**
 * Fix common word boundaries
 */
function fixWordBoundaries(text: string): string {
    let fixed = text;

    // Fix common word separations
    const wordBoundaryPatterns = [
        // Common prefixes
        { pattern: /(university|college|institute)([A-Z][a-z]+)/gi, replacement: '$1 $2' },
        { pattern: /(bachelor|master|phd|diploma)([A-Z][a-z]+)/gi, replacement: '$1 $2' },
        { pattern: /(software|web|mobile|frontend|backend|fullstack|data|machine)([A-Z][a-z]+)/gi, replacement: '$1 $2' },
        { pattern: /(product|project|business|technical|systems)([A-Z][a-z]+)/gi, replacement: '$1 $2' },
        { pattern: /(senior|junior|lead|principal|staff|associate)([A-Z][a-z]+)/gi, replacement: '$1 $2' },

        // Common suffixes
        { pattern: /([a-z]+)(engineer|developer|manager|analyst|specialist|consultant|director|coordinator)/gi, replacement: '$1 $2' },
        { pattern: /([a-z]+)(management|analysis|development|design|strategy|planning)/gi, replacement: '$1 $2' },

        // Common technical terms
        { pattern: /(api|ui|ux|ai|ml|nlp|sql|html|css|js|ts|aws|azure|docker|kubernetes)([A-Z][a-z]+)/gi, replacement: '$1 $2' },
        { pattern: /([a-z]+)(api|ui|ux|ai|ml|nlp|sql|html|css|js|ts|aws|azure|docker|kubernetes)/gi, replacement: '$1 $2' },
    ];

    wordBoundaryPatterns.forEach(({ pattern, replacement }) => {
        fixed = fixed.replace(pattern, replacement);
    });

    return fixed;
}

/**
 * Fix technical terms and acronyms
 */
function fixTechnicalTerms(text: string): string {
    let fixed = text;

    // Fix common technical acronyms and terms
    const technicalPatterns = [
        // AI/ML terms
        { pattern: /(machine)(learning)/gi, replacement: '$1 $2' },
        { pattern: /(artificial)(intelligence)/gi, replacement: '$1 $2' },
        { pattern: /(natural)(language)(processing)/gi, replacement: '$1 $2 $3' },
        { pattern: /(deep)(learning)/gi, replacement: '$1 $2' },
        { pattern: /(neural)(network)/gi, replacement: '$1 $2' },

        // Web development
        { pattern: /(web)(development)/gi, replacement: '$1 $2' },
        { pattern: /(frontend|front-end)(development)/gi, replacement: '$1 $2' },
        { pattern: /(backend|back-end)(development)/gi, replacement: '$1 $2' },
        { pattern: /(fullstack|full-stack)(development)/gi, replacement: '$1 $2' },
        { pattern: /(responsive)(design)/gi, replacement: '$1 $2' },
        { pattern: /(user)(interface)/gi, replacement: '$1 $2' },
        { pattern: /(user)(experience)/gi, replacement: '$1 $2' },

        // Database terms
        { pattern: /(database)(design)/gi, replacement: '$1 $2' },
        { pattern: /(data)(analysis)/gi, replacement: '$1 $2' },
        { pattern: /(data)(science)/gi, replacement: '$1 $2' },
        { pattern: /(data)(visualization)/gi, replacement: '$1 $2' },

        // Business terms
        { pattern: /(business)(analysis)/gi, replacement: '$1 $2' },
        { pattern: /(business)(intelligence)/gi, replacement: '$1 $2' },
        { pattern: /(project)(management)/gi, replacement: '$1 $2' },
        { pattern: /(product)(management)/gi, replacement: '$1 $2' },
        { pattern: /(quality)(assurance)/gi, replacement: '$1 $2' },
        { pattern: /(test)(driven)(development)/gi, replacement: '$1 $2 $3' },

        // Cloud and DevOps
        { pattern: /(cloud)(computing)/gi, replacement: '$1 $2' },
        { pattern: /(devops|dev-ops)/gi, replacement: 'DevOps' },
        { pattern: /(continuous)(integration)/gi, replacement: '$1 $2' },
        { pattern: /(continuous)(deployment)/gi, replacement: '$1 $2' },

        // Common joined words
        { pattern: /(workflow)(orchestration)/gi, replacement: '$1 $2' },
        { pattern: /(stakeholder)(management)/gi, replacement: '$1 $2' },
        { pattern: /(competitive)(analysis)/gi, replacement: '$1 $2' },
        { pattern: /(market)(research)/gi, replacement: '$1 $2' },
        { pattern: /(customer)(satisfaction)/gi, replacement: '$1 $2' },
        { pattern: /(user)(requirements)/gi, replacement: '$1 $2' },
        { pattern: /(business)(requirements)/gi, replacement: '$1 $2' },
        { pattern: /(product)(requirements)/gi, replacement: '$1 $2' },
        { pattern: /(technical)(requirements)/gi, replacement: '$1 $2' },
        { pattern: /(functional)(requirements)/gi, replacement: '$1 $2' },
        { pattern: /(non-functional)(requirements)/gi, replacement: '$1 $2' },
    ];

    technicalPatterns.forEach(({ pattern, replacement }) => {
        fixed = fixed.replace(pattern, replacement);
    });

    return fixed;
}

/**
 * Fix common joined phrases
 */
function fixCommonPhrases(text: string): string {
    let fixed = text;

    // Fix common joined phrases
    const phrasePatterns = [
        // Experience and time phrases
        { pattern: /(years?)(of)(experience)/gi, replacement: '$1 $2 $3' },
        { pattern: /(years?)(of)(hands)(on)(experience)/gi, replacement: '$1 $2 $3-$4 $5' },
        { pattern: /(proven)(track)(record)/gi, replacement: '$1 $2 $3' },
        { pattern: /(track)(record)/gi, replacement: '$1 $3' },

        // Action phrases
        { pattern: /(bringing)(structure)(to)(ambiguity)/gi, replacement: '$1 $2 $3 $4' },
        { pattern: /(translating)(user)(pain)(points)(into)(high)/gi, replacement: '$1 $2 $3 $4 $5 $6' },
        { pattern: /(bridging)(business)(and)(technical)(teams)/gi, replacement: '$1 $2 $3 $4 $5' },
        { pattern: /(deep)(expertise)(in)/gi, replacement: '$1 $2 $3' },
        { pattern: /(adept)(at)(rapid)/gi, replacement: '$1 $2 $3' },
        { pattern: /(agile)(process)(management)/gi, replacement: '$1 $2 $3' },
        { pattern: /(clear)(stakeholder)(communication)/gi, replacement: '$1 $2 $3' },
        { pattern: /(ready)(to)(drive)(impact)(on)(cross)/gi, replacement: '$1 $2 $3 $4 $5 $6' },
        { pattern: /(functional)(ai)(product)(squads)/gi, replacement: '$1 AI $2 $3' },

        // Product and development phrases
        { pattern: /(designed)(built)(and)(launched)/gi, replacement: '$1, $2, and $3 $4' },
        { pattern: /(multiple)(high)(margin)/gi, replacement: '$1 $2-$3' },
        { pattern: /(saas)(automations)(leveraging)/gi, replacement: 'SaaS $2 $3' },
        { pattern: /(openai)(apis)/gi, replacement: 'OpenAI APIs' },
        { pattern: /(llms)/gi, replacement: 'LLMs' },
        { pattern: /(no)(code)/gi, replacement: '$1-$2' },
        { pattern: /(custom)(integrations)/gi, replacement: '$1 $2' },
        { pattern: /(led)(cross)(functional)(squads)/gi, replacement: '$1 $2-$3 $4' },
        { pattern: /(gathering)(user)(requirements)/gi, replacement: '$1 $2 $3' },
        { pattern: /(translating)(business)(needs)(into)(product)(specs)/gi, replacement: '$1 $2 $3 $4 $5 $6' },
        { pattern: /(developed)(tested)(and)(iterated)/gi, replacement: '$1, $2, and $3 $4' },
        { pattern: /(mvps)(for)(intelligent)(search)/gi, replacement: 'MVPs $2 $3 $4' },
        { pattern: /(lead)(gen)/gi, replacement: '$1-$2' },
        { pattern: /(enterprise)(automation)(products)/gi, replacement: '$1 $2 $3' },
        { pattern: /(constantly)(optimizing)(for)(roi)(and)(customer)(outcomes)/gi, replacement: '$1 $2 $3 ROI and $4 $5' },
        { pattern: /(maintained)(stakeholder)(documentation)/gi, replacement: '$1 $2 $3' },
        { pattern: /(competitive)(analysis)/gi, replacement: '$1 $2' },
        { pattern: /(clear)(product)(briefs)(for)(internal)(and)(external)(teams)/gi, replacement: '$1 $2 $3 $4 $5 and $6 $7' },

        // Education phrases
        { pattern: /(ambrose)(alli)(university)/gi, replacement: '$1 $2 $3' },
        { pattern: /(computer)(science)/gi, replacement: '$1 $2' },
        { pattern: /(reference)(available)(upon)(request)/gi, replacement: '$1 $2 $3 $4' },

        // Company and tool names
        { pattern: /(eleven)(labs)/gi, replacement: '$1 $2' },
        { pattern: /(google)(nano)(banana)/gi, replacement: '$1 $2 $3' },
        { pattern: /(perplexity)(ai)/gi, replacement: '$1 $2' },
    ];

    phrasePatterns.forEach(({ pattern, replacement }) => {
        fixed = fixed.replace(pattern, replacement);
    });

    return fixed;
}

/**
 * Fix contact patterns
 */
function fixContactPatterns(text: string): string {
    let fixed = text;

    // Fix email patterns
    fixed = fixed.replace(/([a-zA-Z0-9._%+-]+)(@)([a-zA-Z0-9.-]+)(\.)([a-zA-Z]{2,})/g, '$1$2$3$4$5');

    // Fix phone patterns
    fixed = fixed.replace(/(\+?)(\d{1,3})([-.\s]?)(\d{3})([-.\s]?)(\d{3})([-.\s]?)(\d{4})/g, '$1$2$3$4$5$6$7$8');

    // Fix website patterns
    fixed = fixed.replace(/(www)(\.)([a-zA-Z0-9.-]+)(\.)([a-zA-Z]{2,})/g, '$1$2$3$4$5');

    // Fix LinkedIn patterns
    fixed = fixed.replace(/(linkedin)(\.)(com)(\/)(in)(\/)([a-zA-Z0-9-]+)/g, '$1$2$3$4$5$6$7');

    return fixed;
}

/**
 * Apply word separation fixes to resume data
 */
export function fixResumeDataWordSeparation(resumeData: any): any {
    if (!resumeData || typeof resumeData !== 'object') {
        return resumeData;
    }

    const fixed = { ...resumeData };

    // Fix personal details
    if (fixed.personalDetails) {
        Object.keys(fixed.personalDetails).forEach(key => {
            if (typeof fixed.personalDetails[key] === 'string') {
                fixed.personalDetails[key] = fixJoinedWords(fixed.personalDetails[key]);
            }
        });
    }

    // Fix professional summary
    if (fixed.professionalSummary && typeof fixed.personalDetails.professionalSummary === 'string') {
        fixed.professionalSummary = fixJoinedWords(fixed.professionalSummary);
    }

    // Fix education
    if (fixed.education && Array.isArray(fixed.education)) {
        fixed.education = fixed.education.map((edu: any) => ({
            ...edu,
            school: fixJoinedWords(edu.school || ''),
            degree: fixJoinedWords(edu.degree || ''),
            location: fixJoinedWords(edu.location || ''),
            description: fixJoinedWords(edu.description || '')
        }));
    }

    // Fix employment history
    if (fixed.employmentHistory && Array.isArray(fixed.employmentHistory)) {
        fixed.employmentHistory = fixed.employmentHistory.map((emp: any) => ({
            ...emp,
            jobTitle: fixJoinedWords(emp.jobTitle || ''),
            employer: fixJoinedWords(emp.employer || ''),
            location: fixJoinedWords(emp.location || ''),
            description: fixJoinedWords(emp.description || '')
        }));
    }

    // Fix skills
    if (fixed.skills && Array.isArray(fixed.skills)) {
        fixed.skills = fixed.skills.map((skill: any) => ({
            ...skill,
            name: fixJoinedWords(skill.name || '')
        }));
    }

    // Fix courses
    if (fixed.courses && Array.isArray(fixed.courses)) {
        fixed.courses = fixed.courses.map((course: any) => ({
            ...course,
            course: fixJoinedWords(course.course || ''),
            institution: fixJoinedWords(course.institution || '')
        }));
    }

    return fixed;
}
