import React from 'react';
import type { ResumeData } from '@/lib/types';
import { Section } from './CoolSection';

interface CoolReferencesProps {
  references: ResumeData['references'];
}

export const CoolReferences: React.FC<CoolReferencesProps> = ({ references }) => (
  <Section title="References">
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {references.references.map((ref, index) => (
        <div key={index}>
          <h4 className="font-semibold text-sm">{ref.name}</h4>
          <p className="text-xs text-gray-600">{ref.company || ''}</p>
          <p className="text-xs text-gray-700 mt-1">Phone: {ref.phone || ''}</p>
          <p className="text-xs text-gray-700">Email: {ref.email || ''}</p>
        </div>
      ))}
    </div>
  </Section>
);
