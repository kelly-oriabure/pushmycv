import React from 'react';
import type { Skill } from '@/lib/types';
import { SkillBar } from './helpers';

interface ExecutiveSkillsProps {
  skills: Skill[];
}

export const ExecutiveSkills: React.FC<ExecutiveSkillsProps> = ({ skills }) => {
  return (
    <div>
      <h2 className="text-md font-bold uppercase tracking-wider mb-4">Skills</h2>
      {skills.map(skill => skill.name && <SkillBar key={skill.name} skill={skill.name} level={skill.level ?? 0} />)}
    </div>
  );
};
