import React from 'react';
import type { ResumeData } from '@/lib/types';
import { Section, SectionItem } from './CoolSection';

interface CoolInternshipsProps {
  internships: ResumeData['internships'];
}

export const CoolInternships: React.FC<CoolInternshipsProps> = ({ internships }) => (
  <Section title="Internships">
    {internships.map((internship, index) => (
      <SectionItem
        key={index}
        title={internship.jobTitle}
        subtitle={`${internship.employer} | ${internship.startDate} - ${internship.endDate}`}
      />
    ))}
  </Section>
);
