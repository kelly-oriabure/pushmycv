import React from 'react';
import type { Skill } from '@/lib/types';

interface MilanSkillsProps {
  skills: Skill[];
}

export const MilanSkills: React.FC<MilanSkillsProps> = ({ skills }) => (
  <div>
    <h2 className="font-bold uppercase tracking-wider mb-2 opacity-80">Skills</h2>
    <ul className="space-y-1 opacity-90">
      {skills.map(skill => skill.name && <li key={skill.name}>&bull; {skill.name}</li>)}
    </ul>
  </div>
);
