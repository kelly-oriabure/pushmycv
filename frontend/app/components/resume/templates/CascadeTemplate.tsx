import React from 'react';
import type { ResumeData } from '@/lib/types';
import { dummyResumeData } from '@/data/dummyData';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

// Props for the component
interface CascadeTemplateProps {
    data?: ResumeData;
    color?: string;
}

// Main component
export const CascadeTemplate: React.FC<CascadeTemplateProps> = ({ data = dummyResumeData, color = '#3b82f6' }) => {
    return <ConfigDrivenTemplate templateKey="cascade" data={data} color={color} />;
};

export default CascadeTemplate;
