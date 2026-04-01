import React from 'react';
import type { ResumeData } from '@/lib/types';
import { dummyResumeData } from '@/data/dummyData';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

interface MilanTemplateProps {
    data?: ResumeData;
    color?: string;
}

export const MilanTemplate: React.FC<MilanTemplateProps> = ({ data = dummyResumeData, color = '#800000' }) => {
    return <ConfigDrivenTemplate templateKey="milan" data={data} color={color} />;
};

export default MilanTemplate;
