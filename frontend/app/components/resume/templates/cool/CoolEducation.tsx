import React from 'react';
import type { ResumeData } from '@/lib/types';
import { Section, SectionItem } from './CoolSection';

interface CoolEducationProps {
  education: ResumeData['education'];
}

export const CoolEducation: React.FC<CoolEducationProps> = ({ education }) => (
  <Section title="Education">
    {education.map((edu, index) => (
      <SectionItem
        key={index}
        title={edu.degree}
        subtitle={`${edu.school}${edu.location ? `, ${edu.location}` : ''} | ${edu.startDate} - ${edu.endDate}`}
        description={edu.description}
      />
    ))}
  </Section>
);
