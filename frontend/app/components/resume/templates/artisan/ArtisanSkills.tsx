import React from 'react';
import type { SkillsData } from '@/lib/types';

interface ArtisanSkillsProps {
    skills: SkillsData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanSkills: React.FC<ArtisanSkillsProps> = ({ skills }) => {
    return (
        <Section title="Skills">
            <ul className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                    <li key={i} className="bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                        {skill.name}
                    </li>
                ))}
            </ul>
        </Section>
    );
};
