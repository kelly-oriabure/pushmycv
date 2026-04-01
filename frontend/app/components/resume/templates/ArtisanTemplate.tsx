import React from 'react';
import type { ResumeData } from '@/lib/types';
import { dummyResumeData } from '@/data/dummyData';
import { ConfigDrivenTemplate } from './ConfigDrivenTemplate';

// Props for the component
interface ArtisanTemplateProps {
    data?: ResumeData;
    color?: string;
}

export const ArtisanTemplate: React.FC<ArtisanTemplateProps> = ({ data = dummyResumeData, color = '#4a5568' }) => {
    return <ConfigDrivenTemplate templateKey="artisan" data={data} color={color} />;
};

export default ArtisanTemplate;
