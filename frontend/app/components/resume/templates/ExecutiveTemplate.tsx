import React from 'react';
import type { ResumeData } from '@/lib/types';
import { dummyResumeData } from '@/data/dummyData';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

interface ExecutiveTemplateProps {
  data?: ResumeData;
  color?: string;
}

export const ExecutiveTemplate: React.FC<ExecutiveTemplateProps> = ({ data = dummyResumeData, color = '#334155' }) => {
  return <ConfigDrivenTemplate templateKey="executive" data={data} color={color} />;
};

export default ExecutiveTemplate;
