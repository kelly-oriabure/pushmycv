import React from 'react';
import type { EducationData } from '@/lib/types';
import { Section } from './helpers';

interface ExecutiveEducationProps {
  education: EducationData;
}

export const ExecutiveEducation: React.FC<ExecutiveEducationProps> = ({ education }) => (
  <Section title="Education" className="mb-4">
    {education.map((edu, index) => (
      <div key={index} className="mb-3">
        <h3 className="font-bold text-sm">{edu.degree}, {edu.school}</h3>
        <p className="text-xs text-gray-500 mb-1">{edu.startDate} - {edu.endDate}</p>
        {edu.description && <p className="text-xs">{edu.description}</p>}
      </div>
    ))}
  </Section>
);
