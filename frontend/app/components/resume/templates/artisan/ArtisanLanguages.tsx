import React from 'react';
import type { LanguagesData } from '@/lib/types';

interface ArtisanLanguagesProps {
    languages: Array<LanguagesData[number] | { name?: string | null }>;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanLanguages: React.FC<ArtisanLanguagesProps> = ({ languages }) => {
    if (!languages || languages.length === 0) return null;
    const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
        typeof lang === 'string' ? lang : (lang?.name ?? '');

    return (
        <Section title="Languages">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {languages.map((lang, i) => {
                    const text = getLanguageText(lang);
                    return text ? (
                        <li key={i} className="text-gray-700">
                            {text}
                        </li>
                    ) : null;
                })}
            </ul>
        </Section>
    );
};
