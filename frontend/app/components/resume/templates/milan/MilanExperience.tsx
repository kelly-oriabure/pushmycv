import React from 'react';
import type { EmploymentHistoryData } from '@/lib/types';
import { Section } from './helpers';

interface MilanExperienceProps {
  employmentHistory: EmploymentHistoryData;
  color?: string;
}

export const MilanExperience: React.FC<MilanExperienceProps> = ({ employmentHistory, color }) => (
  <Section title="Experience" color={color}>
    <div className="space-y-6">
      {employmentHistory.map((job, i) => (
        <div key={i}>
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-base">{job.employer}</h3>
            <span className="text-xs text-gray-500 font-medium">{job.startDate} - {job.endDate} | {job.location}</span>
          </div>
          <p className="text-gray-600 text-sm">{job.jobTitle}</p>
          <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1 text-xs">
            {job.description?.split('\n').map((desc, j) => desc.trim() && <li key={j}>{desc}</li>)}
          </ul>
        </div>
      ))}
    </div>
  </Section>
);
