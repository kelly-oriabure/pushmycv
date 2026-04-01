import React from 'react';
import type { LanguagesData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface LanguagesSectionProps extends Omit<BaseSectionProps, 'children'> {
    languages: LanguagesData;
}

export const LanguagesSection: React.FC<LanguagesSectionProps> = ({
    languages,
    title = 'Languages',
    templateStyle,
    color
}) => {
    if (!Array.isArray(languages) || languages.length === 0) return null;

    const items = languages.filter(name => typeof name === 'string' && name.trim() !== '');
    if (items.length === 0) return null;

    return (
        <BaseSection title={title} templateStyle={templateStyle} color={color}>
            <ul className={templateStyle?.layout === 'grid' ? 'grid grid-cols-2 gap-2' : ''}>
                {items.map((name, idx) => (
                    <li key={idx} className="text-sm">{name}</li>
                ))}
            </ul>
        </BaseSection>
    );
};
