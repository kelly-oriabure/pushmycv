import React from 'react';
import type { ResumeData } from '@/lib/types';
import { hasContent } from '@/lib/helpers';
import { SectionRenderer } from '@/components/resume/sections/SectionRenderer';

interface UnifiedTemplateProps {
  data: ResumeData;
  templateKey: string;
  color?: string;
  renderHeader?: (data: ResumeData) => React.ReactNode;
  renderSidebar?: (data: ResumeData) => React.ReactNode;
  sidebarPosition?: 'left' | 'right';
}

export const UnifiedTemplate: React.FC<UnifiedTemplateProps> = ({
  data,
  templateKey,
  color = '#3b82f6',
  renderHeader,
  renderSidebar,
  sidebarPosition = 'left'
}) => {
  const {
    personalDetails,
    professionalSummary,
    employmentHistory,
    education,
    skills,
    languages,
    courses,
    internships,
    references
  } = data;

  const hasPersonalDetails = hasContent(personalDetails);
  const hasProfile = hasContent(professionalSummary);
  const hasExperience = hasContent(employmentHistory);
  const hasEducation = hasContent(education);
  const hasSkills = hasContent(skills);
  const hasLanguages = hasContent(languages);
  const hasCourses = hasContent(courses);
  const hasInternships = hasContent(internships);
  const hasReferences = hasContent(references) && !references.hideReferences;

  const renderMainContent = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-8">
      {hasPersonalDetails && renderHeader && renderHeader(data)}

      <div className="space-y-8">
        {hasProfile && (
          <SectionRenderer
            sectionType="profile"
            data={data}
            templateKey={templateKey}
            color={color}
          />
        )}

        {hasExperience && (
          <SectionRenderer
            sectionType="experience"
            data={data}
            templateKey={templateKey}
            color={color}
          />
        )}

        {hasEducation && (
          <SectionRenderer
            sectionType="education"
            data={data}
            templateKey={templateKey}
            color={color}
          />
        )}

        {hasSkills && (
          <SectionRenderer
            sectionType="skills"
            data={data}
            templateKey={templateKey}
            color={color}
          />
        )}

        {hasCourses && (
          <div className="section">
            <h2 className="text-xl font-bold mb-4">Courses</h2>
            <div className="space-y-3">
              {courses.map((course, index) => (
                <div key={index}>
                  <h3 className="font-semibold">{course.course}</h3>
                  <p className="text-gray-600">{course.institution}</p>
                  <p className="text-sm text-gray-500">
                    {course.startDate} - {course.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasInternships && (
          <div className="section">
            <h2 className="text-xl font-bold mb-4">Internships</h2>
            <div className="space-y-3">
              {internships.map((internship, index) => (
                <div key={index}>
                  <h3 className="font-semibold">{internship.jobTitle}</h3>
                  <p className="text-gray-600">{internship.employer}</p>
                  <p className="text-sm text-gray-500">
                    {internship.location && `${internship.location} | `}
                    {internship.startDate} - {internship.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasLanguages && (
          <div className="section">
            <h2 className="text-xl font-bold mb-4">Languages</h2>
            <ul className="list-disc list-inside space-y-1">
              {languages.map((language, index) => {
                const text =
                  typeof language === 'string'
                    ? language
                    : typeof language === 'object' && language && 'name' in language
                      ? String((language as { name?: unknown }).name ?? '')
                      : '';
                return text ? <li key={index}>{text}</li> : null;
              })}
            </ul>
          </div>
        )}

        {hasReferences && (
          <SectionRenderer
            sectionType="references"
            data={data}
            templateKey={templateKey}
            color={color}
          />
        )}
      </div>
    </div>
  );

  const renderSidebarContent = () => (
    renderSidebar ? renderSidebar(data) : null
  );

  return (
    <div className="flex font-sans bg-white text-gray-800 aspect-[1/1.414] w-full">
      {sidebarPosition === 'left' && renderSidebarContent()}
      {renderMainContent()}
      {sidebarPosition === 'right' && renderSidebarContent()}
    </div>
  );
};
