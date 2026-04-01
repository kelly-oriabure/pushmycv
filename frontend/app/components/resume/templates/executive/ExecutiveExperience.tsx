import React from 'react';
import type { EmploymentHistoryData } from '@/lib/types';
import { Section } from './helpers';

interface ExecutiveExperienceProps {
  employmentHistory: EmploymentHistoryData;
}

export const ExecutiveExperience: React.FC<ExecutiveExperienceProps> = ({ employmentHistory }) => (
  <Section title="Employment History" className="mb-4">
    {employmentHistory.map((job, index) => (
      <div key={index} className="mb-4">
        <h3 className="font-bold text-sm">{job.jobTitle}, {job.employer}</h3>
        <p className="text-xs text-gray-500 mb-1">{job.startDate} - {job.endDate} | {job.location}</p>
        <ul className="list-disc list-inside text-xs space-y-1">
          {job.description?.split('\n').map((item, i) => item.trim() && <li key={i}>{item}</li>)}
        </ul>
      </div>
    ))}
  </Section>
);
