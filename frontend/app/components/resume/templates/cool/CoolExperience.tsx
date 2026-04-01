import React from 'react';
import type { ResumeData } from '@/lib/types';
import { Section, SectionItem } from './CoolSection';

interface CoolExperienceProps {
  employmentHistory: ResumeData['employmentHistory'];
}

export const CoolExperience: React.FC<CoolExperienceProps> = ({ employmentHistory }) => (
  <Section title="Experience">
    {employmentHistory.map((job, index) => (
      <SectionItem
        key={index}
        title={job.jobTitle}
        subtitle={`${job.employer}, ${job.location} | ${job.startDate} - ${job.endDate}`}
        description={job.description}
      />
    ))}
  </Section>
);
