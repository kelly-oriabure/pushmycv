import React from 'react';
import type { PersonalDetailsData, SkillsData, LanguagesData } from '@/lib/types';
import { Section, hasContent } from './helpers';

interface SimpleWhiteSidebarProps {
  personalDetails: PersonalDetailsData;
  skills: SkillsData;
  languages: Array<LanguagesData[number] | { name?: string | null }>;
}

export const SimpleWhiteSidebar: React.FC<SimpleWhiteSidebarProps> = ({ personalDetails, skills, languages }) => {
    const contactInfo = {
        address: personalDetails.address,
        cityState: personalDetails.cityState,
        country: personalDetails.country,
    };
    const getLanguageText = (lang: LanguagesData[number] | { name?: string | null }) =>
        typeof lang === 'string' ? lang : (lang?.name ?? '');

    return (
        <div className="w-1/3 pr-12 border-r-2 border-gray-200 overflow-y-auto hide-scrollbar">
            {hasContent(contactInfo) && (
                <Section title="CONTACT">
                    <p>{personalDetails.address}</p>
                    <p>{personalDetails.cityState}</p>
                    <p>{personalDetails.country}</p>
                </Section>
            )}
            {hasContent(skills) && (
                <Section title="SKILLS">
                    <ul className="list-disc list-inside space-y-1">
                        {skills.map((skill, i) => <li key={i}>{skill.name}</li>)}
                    </ul>
                </Section>
            )}
            {hasContent(languages) && (
                <Section title="LANGUAGES">
                    <ul className="list-disc list-inside space-y-1">
                        {languages.map((lang, i) => {
                            const text = getLanguageText(lang);
                            return text ? <li key={i}>{text}</li> : null;
                        })}
                    </ul>
                </Section>
            )}
        </div>
    );
};
