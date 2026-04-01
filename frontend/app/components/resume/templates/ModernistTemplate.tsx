import React from 'react';

import { dummyResumeData } from '@/data/dummyData';
import type { ResumeData } from '@/lib/types';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

// Define the props for the component
interface ModernistTemplateProps {
    data?: ResumeData;
    color?: string;
}

export const ModernistTemplate: React.FC<ModernistTemplateProps> = ({ data = dummyResumeData, color = '#3b82f6' }) => {
    return <ConfigDrivenTemplate templateKey="modernist" data={data} color={color} />;
};

export default ModernistTemplate;
