import React from 'react';
import type { ReferencesData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteReferencesProps {
  references: ReferencesData;
}

export const SimpleWhiteReferences: React.FC<SimpleWhiteReferencesProps> = ({ references }) => (
  <Section title="REFERENCES">
    <div className="grid grid-cols-2 gap-x-8">
      {references.references.map((ref, i) => (
        <div key={i}>
          <p className="font-bold">{ref.name}</p>
          <p className="text-gray-600">{ref.company || ''}</p>
          <p>Phone: {ref.phone || ''}</p>
          <p>Email: {ref.email || ''}</p>
        </div>
      ))}
    </div>
  </Section>
);
