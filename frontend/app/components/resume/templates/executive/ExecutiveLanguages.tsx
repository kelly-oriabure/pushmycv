import React from 'react';
import type { LanguagesData } from '@/lib/types';

interface ExecutiveLanguagesProps {
  languages: Array<LanguagesData[number] | { name?: string | null }>;
}

export const ExecutiveLanguages: React.FC<ExecutiveLanguagesProps> = ({ languages }) => {
  const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
    typeof lang === 'string' ? lang : (lang?.name ?? '');

  return (
    <div className="mt-6">
      <h2 className="text-md font-bold uppercase tracking-wider mb-3">Languages</h2>
      <div className="text-xs space-y-1">
        {languages.map((lang, index) => {
          const text = getLanguageText(lang);
          return text ? <p key={index}>{text}</p> : null;
        })}
      </div>
    </div>
  );
};
