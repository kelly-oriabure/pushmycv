import React from 'react';
import type { SkillsData } from '@/lib/types';
import { Section } from './helpers';

interface ModernistSkillsProps {
  skills: SkillsData;
  color: string;
}

// The original template grouped skills by category, which is not supported by the global SkillsData type.
// This component will render a single list of skills.
export const ModernistSkills: React.FC<ModernistSkillsProps> = ({ skills, color }) => (
  <Section title="Skills" color={color}>
    <ul className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
      {skills.map((skill, i) => (
        <li key={i}>{skill.name}</li>
      ))}
    </ul>
  </Section>
);
