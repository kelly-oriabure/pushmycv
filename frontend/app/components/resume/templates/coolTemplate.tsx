import React from 'react';
import type { ResumeData } from '@/lib/types';
import { dummyResumeData } from '@/data/dummyData';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

interface CoolTemplateProps {
  data?: ResumeData;
  color?: string;
}

const CoolTemplateComponent: React.FC<CoolTemplateProps> = ({ data = dummyResumeData, color = '#232c3d' }) => {
  return <ConfigDrivenTemplate templateKey="cool" data={data} color={color} />;
};

export const CoolTemplate = React.memo(CoolTemplateComponent);
CoolTemplate.displayName = 'CoolTemplate';
