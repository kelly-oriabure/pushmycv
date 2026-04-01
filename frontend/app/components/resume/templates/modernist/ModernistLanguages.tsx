import React from 'react';
import type { LanguagesData } from '@/lib/types';
import { Section } from './helpers';

interface ModernistLanguagesProps {
  languages: Array<LanguagesData[number] | { name?: string | null }>;
  color: string;
}

export const ModernistLanguages: React.FC<ModernistLanguagesProps> = ({ languages, color }) => {
  const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
    typeof lang === 'string' ? lang : (lang?.name ?? '');

  return Array.isArray(languages) && languages.length > 0 ? (
    <Section title="Languages" color={color}>
      <ul className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
        {languages.map((lang, i) => {
          const text = getLanguageText(lang);
          return text ? <li key={i}>{text}</li> : null;
        })}
      </ul>
    </Section>
  ) : null;
};
