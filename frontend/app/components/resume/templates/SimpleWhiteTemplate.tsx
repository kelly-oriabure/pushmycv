import React from 'react';
import { dummyResumeData } from '@/data/dummyData';
import type { ResumeData } from '@/lib/types';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

interface SimpleWhiteTemplateProps {
  data?: ResumeData;
  color?: string;
}

export const SimpleWhiteTemplate: React.FC<SimpleWhiteTemplateProps> = ({ data = dummyResumeData, color }) => {
  return <ConfigDrivenTemplate templateKey="simple-white" data={data} color={color} />;
};

export default SimpleWhiteTemplate;
