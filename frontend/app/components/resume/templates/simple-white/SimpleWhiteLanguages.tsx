import React from 'react';
import type { LanguagesData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteLanguagesProps {
  languages: Array<LanguagesData[number] | { name?: string | null }>;
}

export const SimpleWhiteLanguages: React.FC<SimpleWhiteLanguagesProps> = ({ languages }) => {
  const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
    typeof lang === 'string' ? lang : (lang?.name ?? '');

  return (
    <Section title="LANGUAGES">
      <ul className="list-disc list-inside space-y-1">
        {languages.map((lang, i) => {
          const text = getLanguageText(lang);
          return text ? <li key={i}>{text}</li> : null;
        })}
      </ul>
    </Section>
  );
};
