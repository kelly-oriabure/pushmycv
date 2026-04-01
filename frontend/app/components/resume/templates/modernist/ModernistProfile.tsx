import React from 'react';
import type { ProfessionalSummaryData } from '@/lib/types';

interface ModernistProfileProps {
  professionalSummary: ProfessionalSummaryData;
}

export const ModernistProfile: React.FC<ModernistProfileProps> = ({ professionalSummary }) => (
  professionalSummary ? (
    <section className="mb-8">
      <div className="text-center text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: professionalSummary }} />
    </section>
  ) : null
);
