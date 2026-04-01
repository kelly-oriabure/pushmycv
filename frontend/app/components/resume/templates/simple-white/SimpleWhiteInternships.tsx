import React from 'react';
import type { InternshipsData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteInternshipsProps {
  internships: InternshipsData;
}

export const SimpleWhiteInternships: React.FC<SimpleWhiteInternshipsProps> = ({ internships }) => (
  <Section title="INTERNSHIPS">
    {internships.map((job, i) => (
      <div key={i} className="mb-5">
        <div className="flex justify-between items-baseline">
          <p className="font-bold text-sm">{job.employer}</p>
          <p className="text-gray-500 text-xs">{job.startDate} - {job.endDate}</p>
        </div>
        <p className="text-gray-600 mb-2">{job.jobTitle}</p>
      </div>
    ))}
  </Section>
);
