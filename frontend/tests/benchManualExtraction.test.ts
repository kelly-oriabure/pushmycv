import { extractResumeDataFromText } from '@/lib/services/resumeExtractionService';

function flattenWhitespacePreserveSpaces(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

type GroundTruth = {
  name: { firstName: string; lastName: string };
  email: string;
  phone: string;
  skills: string[];
  experienceCount: number;
  educationCount: number;
};

function normalizeSkill(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreSkills(extracted: string[], truth: string[]) {
  const extractedSet = new Set(extracted.map(normalizeSkill));
  const truthSet = new Set(truth.map(normalizeSkill));
  const tp = [...extractedSet].filter(x => truthSet.has(x)).length;
  const fp = extractedSet.size - tp;
  const fn = truthSet.size - tp;
  const precision = extractedSet.size === 0 ? 0 : tp / extractedSet.size;
  const recall = truthSet.size === 0 ? 0 : tp / truthSet.size;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, fp, fn, precision, recall, f1 };
}

describe('Manual extraction benchmark (resume sample)', () => {
  test('compares structured vs flattened text', async () => {
    const sampleText = `
ORIABURE KELLY
LinkedIn: www.linkedin.com/in/oriabure-kelly, Website: kellycode.com.ng
Lagos, Nigeria.
kellyobehi.oriabure@gmail.com  +234 8161177351

Business-focused AI Product Manager and Automation Specialist with 6+ years of hands-on experience designing, deploying, and scaling intelligent automation solutions for SMBs and SaaS. Proven track record bringing structure to ambiguity, translating user pain points into high-ROI product requirements, and bridging business and technical teams. Deep expertise in AI-powered automation, workflow orchestration, B2B SaaS, and digital content strategy. Adept at rapid MVP validation, agile process management, and clear stakeholder communication. Ready to drive impact on cross-functional AI product squads.

EXPERIENCE
AI Automation & Product Lead, Flowsyntax - Lagos, Nigeria  2024-2025
- Designed, built, and launched multiple high-performing B2C SaaS automations leveraging AI (OpenAI APIs, LLMs, no-code, and custom integrations (n8n)).
- Led cross-functional squads gathering user requirements, translating business needs into product specs, and overseeing agile sprint planning and backlog grooming.
- Developed, tested, and iterated MVPs for intelligent search, lead gen, and enterprise automation products—constantly optimizing for ROI and customer outcomes.
- Maintained stakeholder documentation, competitive analysis, and clear product briefs for internal and external teams.

EDUCATION
Ambrose Ali University  2007-2011
B.Sc., Computer Science, Ekpoma

SKILLS
n8n, ElevenLabs, Google VO3, Google Nano Banana, OpenAI, FAL, Anthropic, Perplexity AI

REFERENCES
Reference available upon request
`.trim();

    const truth: GroundTruth = {
      name: { firstName: 'ORIABURE', lastName: 'KELLY' },
      email: 'kellyobehi.oriabure@gmail.com',
      phone: '+2348161177351',
      skills: ['n8n', 'ElevenLabs', 'Google VO3', 'Google Nano Banana', 'OpenAI', 'FAL', 'Anthropic', 'Perplexity AI'],
      experienceCount: 1,
      educationCount: 1,
    };

    const structuredInput = {
      fullText: sampleText,
      contactInfo: { emails: [truth.email], phones: [truth.phone] },
      contentHash: '',
      emailHash: null,
      phoneHash: null,
      compositeHash: '',
    };

    const flattenedInput = {
      ...structuredInput,
      fullText: flattenWhitespacePreserveSpaces(sampleText),
    };

    const t0 = performance.now();
    const structured = await extractResumeDataFromText(structuredInput as any);
    const t1 = performance.now();
    const flattened = await extractResumeDataFromText(flattenedInput as any);
    const t2 = performance.now();

    const structuredSkills = (structured.skills || []).map((s: any) => s?.name).filter(Boolean);
    const flattenedSkills = (flattened.skills || []).map((s: any) => s?.name).filter(Boolean);

    const structuredScore = scoreSkills(structuredSkills, truth.skills);
    const flattenedScore = scoreSkills(flattenedSkills, truth.skills);

    const structuredNameOk =
      structured.personalDetails?.firstName?.toUpperCase() === truth.name.firstName &&
      structured.personalDetails?.lastName?.toUpperCase() === truth.name.lastName;

    const structuredEmailOk = (structured.personalDetails?.email || '').toLowerCase() === truth.email.toLowerCase();
    const structuredPhoneOk = (structured.personalDetails?.phone || '').replace(/[^\d+]/g, '') === truth.phone;

    const flattenedNameOk =
      flattened.personalDetails?.firstName?.toUpperCase() === truth.name.firstName &&
      flattened.personalDetails?.lastName?.toUpperCase() === truth.name.lastName;

    const flattenedEmailOk = (flattened.personalDetails?.email || '').toLowerCase() === truth.email.toLowerCase();
    const flattenedPhoneOk = (flattened.personalDetails?.phone || '').replace(/[^\d+]/g, '') === truth.phone;

    const structuredExperienceCount = (structured.employmentHistory || []).length;
    const structuredEducationCount = (structured.education || []).length;
    const flattenedExperienceCount = (flattened.employmentHistory || []).length;
    const flattenedEducationCount = (flattened.education || []).length;

    const report = {
      timingsMs: {
        structured: Math.round((t1 - t0) * 100) / 100,
        flattened: Math.round((t2 - t1) * 100) / 100,
      },
      structured: {
        nameOk: structuredNameOk,
        emailOk: structuredEmailOk,
        phoneOk: structuredPhoneOk,
        personalDetails: structured.personalDetails,
        skills: structuredSkills,
        skillsScore: structuredScore,
        experienceCount: structuredExperienceCount,
        educationCount: structuredEducationCount,
      },
      flattened: {
        nameOk: flattenedNameOk,
        emailOk: flattenedEmailOk,
        phoneOk: flattenedPhoneOk,
        personalDetails: flattened.personalDetails,
        skills: flattenedSkills,
        skillsScore: flattenedScore,
        experienceCount: flattenedExperienceCount,
        educationCount: flattenedEducationCount,
      },
    };

    console.log(JSON.stringify(report, null, 2));

    expect(structuredScore.recall).toBeGreaterThanOrEqual(flattenedScore.recall);
  });
});
