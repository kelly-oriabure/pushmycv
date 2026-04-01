import React from 'react';
import type { InternshipsData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface InternshipsSectionProps extends Omit<BaseSectionProps, 'children'> {
  internships: InternshipsData;
}

export const InternshipsSection: React.FC<InternshipsSectionProps> = ({
  internships,
  title = 'Internships',
  templateStyle,
  color
}) => {
  if (!Array.isArray(internships) || internships.length === 0) return null;

  const items = internships.filter(
    (internship) =>
      Boolean(internship?.jobTitle && internship.jobTitle.trim() !== '') ||
      Boolean(internship?.employer && internship.employer.trim() !== '')
  );
  if (items.length === 0) return null;

  const containerClass =
    templateStyle?.layout === 'grid'
      ? items.length > 1
        ? 'grid grid-cols-2 gap-x-8 gap-y-4'
        : 'space-y-3'
      : 'space-y-3';

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      <div className={containerClass}>
        {items.map((internship, index) => (
          <div key={index} className={templateStyle?.layout === 'grid' ? '' : 'mb-2'}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-base">{internship.jobTitle}</h3>
              {(internship.startDate || internship.endDate) && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {internship.startDate} - {internship.endDate}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm">
              {internship.employer}
              {internship.location ? `, ${internship.location}` : ''}
            </p>
          </div>
        ))}
      </div>
    </BaseSection>
  );
};

