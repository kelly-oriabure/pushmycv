import type { ResumeData } from '@/lib/types';

export function toCustomSections(resumeData: ResumeData) {
  return {
    personalDetails: resumeData.personalDetails,
    professionalSummary: resumeData.professionalSummary,
    education: resumeData.education.map(edu => ({
      school: edu.school,
      degree: edu.degree,
      startDate: edu.startDate,
      endDate: edu.endDate,
      location: edu.location,
      description: edu.description,
    })),
    experience: resumeData.employmentHistory.map(exp => ({
      jobTitle: exp.jobTitle,
      employer: exp.employer,
      startDate: exp.startDate,
      endDate: exp.endDate,
      location: exp.location,
      description: exp.description,
    })),
    skills: resumeData.skills.map(skill => ({
      name: skill.name,
      level: skill.level,
    })),
    languages: resumeData.languages.map(lang => ({ name: lang })),
    references: resumeData.references.references,
    courses: resumeData.courses.map(course => ({
      course: course.course,
      institution: course.institution,
      startDate: course.startDate,
      endDate: course.endDate,
    })),
    internships: resumeData.internships,
  };
}

