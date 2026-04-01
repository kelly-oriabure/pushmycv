import React from 'react';
import type { LanguagesData } from '@/lib/types';

interface MilanLanguagesProps {
  languages: Array<LanguagesData[number] | { name?: string | null }>;
}

export const MilanLanguages: React.FC<MilanLanguagesProps> = ({ languages }) => {
  const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
    typeof lang === 'string' ? lang : (lang?.name ?? '');

  return (
    <div>
      <h2 className="font-bold uppercase tracking-wider mb-2 opacity-80">Languages</h2>
      <ul className="space-y-1 opacity-90">
        {languages.map((lang, index) => {
          const text = getLanguageText(lang);
          return text ? <li key={index}>&bull; {text}</li> : null;
        })}
      </ul>
    </div>
  );
};
