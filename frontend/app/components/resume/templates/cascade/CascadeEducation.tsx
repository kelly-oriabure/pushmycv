import React from 'react';
import type { EducationData } from '@/lib/types';
import { TimelineSection, TimelineItem } from './helpers';
import { GraduationCap } from 'lucide-react';

interface CascadeEducationProps {
    education: EducationData;
    color: string;
}

export const CascadeEducation: React.FC<CascadeEducationProps> = ({ education, color }) => (
    <TimelineSection icon={<GraduationCap size={16} />} title="Education">
        {education.map((edu, i) => (
            <TimelineItem key={i} title={edu.degree} subtitle={edu.school} period={`${edu.startDate} - ${edu.endDate}`} description={edu.description} color={color} />
        ))}
    </TimelineSection>
);
