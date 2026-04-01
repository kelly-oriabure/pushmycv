import React from 'react';
import type { EducationData } from '@/lib/types';
import { Section } from './helpers';

interface MilanEducationProps {
  education: EducationData;
  color?: string;
}

export const MilanEducation: React.FC<MilanEducationProps> = ({ education, color }) => (
  <Section title="Education" color={color} className="mb-0">
    <div className="space-y-4">
      {education.map((edu, i) => (
        <div key={i}>
          <h3 className="font-semibold text-base">{edu.degree}</h3>
          <p className="text-gray-600 text-sm">{edu.school}{edu.location ? `, ${edu.location}` : ''}</p>
          <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
        </div>
      ))}
    </div>
  </Section>
);
