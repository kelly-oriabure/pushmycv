import React from 'react';
import type { EmploymentHistoryData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteExperienceProps {
  employmentHistory: EmploymentHistoryData;
}

export const SimpleWhiteExperience: React.FC<SimpleWhiteExperienceProps> = ({ employmentHistory }) => (
  <Section title="WORK EXPERIENCE">
    {employmentHistory.map((job, i) => (
      <div key={i} className="mb-5">
        <div className="flex justify-between items-baseline">
          <p className="font-bold text-sm">{job.employer}</p>
          <p className="text-gray-500 text-xs">{job.startDate} - {job.endDate}</p>
        </div>
        <p className="text-gray-600 mb-2">{job.jobTitle}</p>
        <ul className="list-disc list-inside space-y-1">
          {job.description.split('\n').map((desc, j) => desc.trim() && <li key={j}>{desc}</li>)}
        </ul>
      </div>
    ))}
  </Section>
);
