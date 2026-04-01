import React from 'react';
import type { InternshipsData } from '@/lib/types';
import { Section } from './helpers';

interface ExecutiveInternshipsProps {
  internships: InternshipsData;
}

export const ExecutiveInternships: React.FC<ExecutiveInternshipsProps> = ({ internships }) => (
  <Section title="Internships">
    {internships.map((internship, index) => (
      <div key={index} className="mb-4">
        <h3 className="font-bold text-sm">{internship.jobTitle}, {internship.employer}</h3>
        <p className="text-xs text-gray-500 mb-1">{internship.startDate} - {internship.endDate}</p>
      </div>
    ))}
  </Section>
);
