import React from 'react';
import type { EducationData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteEducationProps {
  education: EducationData;
}

export const SimpleWhiteEducation: React.FC<SimpleWhiteEducationProps> = ({ education }) => (
  <Section title="EDUCATION">
    {education.map((edu, i) => (
      <div key={i} className="mb-4">
        <p className="font-bold text-sm">{edu.degree}</p>
        <p>{edu.school}{edu.location ? `, ${edu.location}` : ''}</p>
        <p className="text-gray-500">{edu.startDate} - {edu.endDate}</p>
      </div>
    ))}
  </Section>
);
