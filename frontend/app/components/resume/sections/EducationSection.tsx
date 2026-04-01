import React from 'react';
import type { EducationData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface EducationSectionProps extends Omit<BaseSectionProps, 'children'> {
  education: EducationData;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  title = 'Education',
  templateStyle,
  color
}) => {
  if (!Array.isArray(education) || education.length === 0) return null;

  const getLayoutClass = () => {
    if (templateStyle?.layout === 'grid') {
      return education.length > 1 ? 'grid grid-cols-2 gap-x-8 gap-y-4' : 'space-y-4';
    }
    return 'space-y-4';
  };

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      <div className={getLayoutClass()}>
        {education.map((edu, index) => (
          <div key={index} className={templateStyle?.layout === 'grid' ? '' : 'mb-2'}>
            {edu?.degree && edu.degree.trim() !== '' ? (
              <h3 className="font-semibold text-base">{edu.degree}</h3>
            ) : null}
            <p className="text-gray-600 text-sm">
              {edu?.school || ''}{edu?.location ? `, ${edu.location}` : ''}
            </p>
            <p className="text-xs text-gray-500">
              {edu?.startDate || ''} - {edu?.endDate || ''}
            </p>
            {edu?.description && (() => {
              const cleaned = edu.description.replace(/<h3[^>]*>\s*(?:<br\s*\/?>|&nbsp;|<strong>\s*<br\s*\/?>\s*<\/strong>|<em>\s*<br\s*\/?>\s*<\/em>|\s)*<\/h3>/gi, '');
              return cleaned.trim() !== '' ? (
                <div className="text-xs mt-1 text-gray-700" dangerouslySetInnerHTML={{ __html: cleaned }} />
              ) : null;
            })()}
          </div>
        ))}
      </div>
    </BaseSection>
  );
};