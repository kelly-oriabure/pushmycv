import React from 'react';
import type { EducationData } from '@/lib/types';
import { Section } from './helpers';

interface ModernistEducationProps {
  education: EducationData;
  color: string;
}

export const ModernistEducation: React.FC<ModernistEducationProps> = ({ education, color }) => {
  if (!Array.isArray(education) || education.length === 0) return null;
  const containerClass = education.length > 1
    ? 'grid grid-cols-2 gap-x-8 gap-y-4'
    : 'space-y-4';

  return (
    <Section title="Education" color={color}>
      <div className={containerClass}>
        {education.map((edu, i) => (
          <div key={i}>
            <h3 className="font-semibold text-base">{edu?.degree || ''}</h3>
            <p className="text-gray-600 text-sm">{edu?.school || ''}{edu?.location ? `, ${edu.location}` : ''}</p>
            <p className="text-xs text-gray-500">{edu?.startDate || ''} - {edu?.endDate || ''}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};
