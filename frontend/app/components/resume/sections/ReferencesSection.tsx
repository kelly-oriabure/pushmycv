import React from 'react';
import type { ReferencesData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface ReferencesSectionProps extends Omit<BaseSectionProps, 'children'> {
  references: ReferencesData;
}

export const ReferencesSection: React.FC<ReferencesSectionProps> = ({
  references,
  title = 'References',
  templateStyle,
  color
}) => {
  if (!references || !Array.isArray(references.references) || references.references.length === 0 || references.hideReferences) {
    return null;
  }

  const getLayoutClass = () => {
    if (templateStyle?.layout === 'grid') {
      return 'grid grid-cols-2 gap-x-8 gap-y-4';
    }
    // Default: display references in a row when more than one
    return references.references.length > 1 ? 'grid grid-cols-2 gap-x-8 gap-y-4' : 'space-y-3';
  };

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      <div className={getLayoutClass()}>
        {references.references.map((ref, index) => (
          <div key={index}>
            <h4 className="font-semibold text-sm">{ref?.name || ''}</h4>
            {ref?.company && (
              <p className="text-gray-600 text-xs">{ref.company}</p>
            )}
            <p className="text-xs text-gray-700 mt-1">
              {ref?.phone ? `Phone: ${ref.phone}` : ''}
              {ref?.phone && ref?.email ? ' | ' : ''}
              {ref?.email ? `Email: ${ref.email}` : ''}
            </p>
          </div>
        ))}
      </div>
    </BaseSection>
  );
};