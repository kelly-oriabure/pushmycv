import React from 'react';
import type { ReferencesData } from '@/lib/types';
import { Section } from './helpers';

interface ModernistReferencesProps {
  references: ReferencesData;
  color: string;
}

export const ModernistReferences: React.FC<ModernistReferencesProps> = ({ references, color }) => (
  references && Array.isArray(references.references) && references.references.length > 0 && !references.hideReferences ? (
    <Section title="References" color={color}>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {references.references.map((ref, i) => (
          <div key={i}>
            <h3 className="font-semibold text-base">{ref?.name || ''}</h3>
            <p className="text-gray-600 text-sm">{ref?.company || ''}</p>
            <p className="text-xs text-gray-500">{ref?.phone || ''} | {ref?.email || ''}</p>
          </div>
        ))}
      </div>
    </Section>
  ) : null
);
