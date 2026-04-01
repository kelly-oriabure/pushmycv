import React from 'react';
import type { SkillsData } from '@/lib/types';
import { Section } from './helpers';
import { Hash } from 'lucide-react';

interface CascadeSkillsProps {
    skills: SkillsData;
}

export const CascadeSkills: React.FC<CascadeSkillsProps> = ({ skills }) => (
    <Section icon={<Hash size={14} />} title="Skills">
        <ul className="list-disc list-inside">
            {skills.map((skill, index) => <li key={index}>{skill.name}</li>)}
        </ul>
    </Section>
);
