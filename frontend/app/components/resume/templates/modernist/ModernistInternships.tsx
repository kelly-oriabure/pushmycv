import React from 'react';
import type { InternshipsData } from '@/lib/types';
import { Section } from './helpers';

interface ModernistInternshipsProps {
  internships: InternshipsData;
  color: string;
}

export const ModernistInternships: React.FC<ModernistInternshipsProps> = ({ internships, color }) => (
  Array.isArray(internships) && internships.length > 0 ? (
    <Section title="Internships" color={color}>
      <div className="space-y-6">
        {internships.map((job, i) => (
          <div key={i}>
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold text-base">{job?.jobTitle || ''}</h3>
              <span className="text-xs text-gray-500 font-medium">{job?.startDate || ''} - {job?.endDate || ''} | {job?.location || ''}</span>
            </div>
            <p className="text-gray-600 text-sm">{job?.employer || ''}</p>
          </div>
        ))}
      </div>
    </Section>
  ) : null
);
