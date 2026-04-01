import React from 'react';
import { Section } from './helpers';

interface MilanProfileProps {
  professionalSummary: string;
  color?: string;
}

export const MilanProfile: React.FC<MilanProfileProps> = ({ professionalSummary, color }) => (
  <Section title="Profile" color={color}>
    <p className="text-sm text-gray-700">{professionalSummary}</p>
  </Section>
);
