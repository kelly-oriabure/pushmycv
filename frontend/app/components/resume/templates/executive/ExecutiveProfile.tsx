import React from 'react';
import type { ProfessionalSummaryData } from '@/lib/types';
import { Section } from './helpers';

interface ExecutiveProfileProps {
  professionalSummary: ProfessionalSummaryData;
}

export const ExecutiveProfile: React.FC<ExecutiveProfileProps> = ({ professionalSummary }) => (
  <Section title="Profile" className="mb-4">
    <div className="text-xs prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: professionalSummary }} />
  </Section>
);
