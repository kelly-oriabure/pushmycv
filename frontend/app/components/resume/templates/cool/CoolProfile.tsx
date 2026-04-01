import React from 'react';
import { Section } from './CoolSection';

interface CoolProfileProps {
  professionalSummary: string;
}

export const CoolProfile: React.FC<CoolProfileProps> = ({ professionalSummary }) => (
  <Section title="Profile">
    <p className="text-xs text-gray-700">{professionalSummary}</p>
  </Section>
);
