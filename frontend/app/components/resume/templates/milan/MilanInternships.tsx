import React from 'react';
import type { Internship } from '@/lib/types';
import { Section } from './helpers';

interface MilanInternshipsProps {
  internships: Internship[];
  color?: string;
}

export const MilanInternships: React.FC<MilanInternshipsProps> = ({ internships, color }) => (
  <Section title="Internships" color={color}>
    <div className="space-y-6">
      {internships.map((job, i) => (
        <div key={i}>
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-base">{job.employer}</h3>
            <span className="text-xs text-gray-500 font-medium">{job.startDate} - {job.endDate} | {job.location}</span>
          </div>
          <p className="text-gray-600 text-sm">{job.jobTitle}</p>

        </div>
      ))}
    </div>
  </Section>
);
