import React from 'react';
import type { ReferencesData } from '@/lib/types';
import { Section } from './helpers';

interface MilanReferencesProps {
  references: ReferencesData;
  color?: string;
}

export const MilanReferences: React.FC<MilanReferencesProps> = ({ references, color }) => (
  <Section title="References" color={color} className="mb-0">
    <div className="space-y-4">
      {references.references.map((ref, i) => (
        <div key={i}>
          <h3 className="font-semibold text-base">{ref.name}</h3>
          <p className="text-gray-600 text-sm">{ref.company || ''}</p>
          <p className="text-xs text-gray-500">{ref.phone || ''} | {ref.email || ''}</p>
        </div>
      ))}
    </div>
  </Section>
);
