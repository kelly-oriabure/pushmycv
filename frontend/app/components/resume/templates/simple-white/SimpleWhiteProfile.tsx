import React from 'react';
import type { ProfessionalSummaryData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteProfileProps {
  professionalSummary: ProfessionalSummaryData;
}

export const SimpleWhiteProfile: React.FC<SimpleWhiteProfileProps> = ({ professionalSummary }) => (
  <Section title="PROFILE">
    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: professionalSummary }} />
  </Section>
);
