import React from 'react';
import type { EmploymentHistoryData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface ExperienceSectionProps extends Omit<BaseSectionProps, 'children'> {
  employmentHistory: EmploymentHistoryData;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  employmentHistory,
  title = 'Experience',
  templateStyle,
  color
}) => {
  if (!Array.isArray(employmentHistory) || employmentHistory.length === 0) return null;

  const getLayoutClass = () => {
    if (templateStyle?.layout === 'grid') {
      return employmentHistory.length > 1 ? 'grid grid-cols-2 gap-x-8 gap-y-4' : 'space-y-4';
    }
    return 'space-y-4';
  };

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      <div className={getLayoutClass()}>
        {employmentHistory.map((job, index) => (
          <div key={index} className={templateStyle?.layout === 'grid' ? '' : 'mb-3'}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-base">{job?.jobTitle || ''}</h3>
              {(job?.startDate || job?.endDate) && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {job.startDate} - {job.endDate || 'Present'}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm">
              {job?.employer || ''}{job?.location ? `, ${job.location}` : ''}
            </p>
            {job?.description && (
              <div className="text-xs mt-1 text-gray-700" dangerouslySetInnerHTML={{ __html: job.description }} />
            )}
          </div>
        ))}
      </div>
    </BaseSection>
  );
};