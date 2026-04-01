import React from 'react';
import type { ReferencesData } from '@/lib/types';
import { Section } from './helpers';

interface ExecutiveReferencesProps {
  references?: ReferencesData;
}

export const ExecutiveReferences: React.FC<ExecutiveReferencesProps> = ({ references }) => (
  <Section title="References" className="mb-0">
    {references?.references?.map((ref, index) => (
      <div key={index} className="mb-3">
        <h3 className="font-bold text-sm">{ref.name} - {ref.company}</h3>
        <p className="text-xs">{ref.phone} | {ref.email}</p>
      </div>
    ))}
  </Section>
);
