import React from 'react';
import type { SkillsData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface SkillsSectionProps extends Omit<BaseSectionProps, 'children'> {
  skills: SkillsData;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ 
  skills, 
  title = 'Skills',
  templateStyle,
  color
}) => {
  if (!Array.isArray(skills) || skills.length === 0) return null;

  const getLayoutClass = () => {
    if (templateStyle?.layout === 'grid') {
      return 'grid grid-cols-2 gap-2';
    }
    return '';
  };

  const renderSkillItem = (skill: { name: string; level: number }, index: number) => {
    if (templateStyle?.titleStyle === 'boxed') {
      return (
        <span 
          key={index} 
          className="inline-block px-2 py-1 text-xs rounded mr-2 mb-2"
          style={{ backgroundColor: color, color: 'white' }}
        >
          {skill.name}
        </span>
      );
    }
    return (
      <li key={index} className="text-sm">
        {skill.name}
      </li>
    );
  };

  // Extract skill names for rendering
  const skillItems = skills.filter(skill => skill.name && skill.name.trim() !== '');

  if (skillItems.length === 0) return null;

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      {templateStyle?.titleStyle === 'boxed' ? (
        <div className={getLayoutClass()}>
          {skillItems.map((skill, index) => renderSkillItem(skill, index))}
        </div>
      ) : (
        <ul className={getLayoutClass()}>
          {skillItems.map((skill, index) => renderSkillItem(skill, index))}
        </ul>
      )}
    </BaseSection>
  );
};