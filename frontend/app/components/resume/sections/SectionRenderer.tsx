import React from 'react';
import type { ResumeData } from '@/lib/types';
import { getTemplateStyleConfig } from '@/lib/utils/templateStyleConfig';
import { EducationSection } from './EducationSection';
import { ExperienceSection } from './ExperienceSection';
import { SkillsSection } from './SkillsSection';
import { ReferencesSection } from './ReferencesSection';
import { ProfileSection } from './ProfileSection';
import { LanguagesSection } from './LanguagesSection';
import { CoursesSection } from './CoursesSection';
import { InternshipsSection } from './InternshipsSection';

interface SectionRendererProps {
  sectionType:
    | 'education'
    | 'experience'
    | 'skills'
    | 'references'
    | 'profile'
    | 'languages'
    | 'courses'
    | 'internships';
  data: ResumeData;
  templateKey: string;
  color?: string;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  sectionType,
  data,
  templateKey,
  color = '#3b82f6'
}) => {
  const templateStyle = getTemplateStyleConfig(templateKey, sectionType);

  switch (sectionType) {
    case 'education':
      return (
        <EducationSection
          education={data.education}
          templateStyle={templateStyle}
          color={color}
          title="Education"
        />
      );

    case 'experience':
      return (
        <ExperienceSection
          employmentHistory={data.employmentHistory}
          templateStyle={templateStyle}
          color={color}
          title="Experience"
        />
      );

    case 'skills':
      return (
        <SkillsSection
          skills={data.skills}
          templateStyle={templateStyle}
          color={color}
          title="Skills"
        />
      );

    case 'languages':
      return (
        <LanguagesSection
          languages={data.languages}
          templateStyle={templateStyle}
          color={color}
          title="Languages"
        />
      );

    case 'courses':
      return (
        <CoursesSection
          courses={data.courses}
          templateStyle={templateStyle}
          color={color}
          title="Courses"
        />
      );

    case 'internships':
      return (
        <InternshipsSection
          internships={data.internships}
          templateStyle={templateStyle}
          color={color}
          title="Internships"
        />
      );

    case 'references':
      return (
        <ReferencesSection
          references={data.references}
          templateStyle={templateStyle}
          color={color}
          title="References"
        />
      );

    case 'profile':
      return (
        <ProfileSection
          professionalSummary={data.professionalSummary}
          templateStyle={templateStyle}
          color={color}
          title="Profile"
        />
      );

    default:
      return null;
  }
};
