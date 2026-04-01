import React from 'react';
import type { LanguagesData } from '@/lib/types';
import { Section } from './helpers';
import { Globe } from 'lucide-react';

interface CascadeLanguagesProps {
    languages: Array<LanguagesData[number] | { name?: string | null }>;
}

export const CascadeLanguages: React.FC<CascadeLanguagesProps> = ({ languages }) => {
    const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
        typeof lang === 'string' ? lang : (lang?.name ?? '');

    return (
        <Section icon={<Globe size={14} />} title="Languages">
            <ul className="list-disc list-inside">
                {languages.map((lang, index) => {
                    const text = getLanguageText(lang);
                    return text ? <li key={index}>{text}</li> : null;
                })}
            </ul>
        </Section>
    );
};
