import React from 'react';
import type { EmploymentHistoryData } from '@/lib/types';
import { TimelineSection, TimelineItem } from './helpers';
import { Briefcase } from 'lucide-react';

interface CascadeExperienceProps {
    employmentHistory: EmploymentHistoryData;
    color: string;
}

export const CascadeExperience: React.FC<CascadeExperienceProps> = ({ employmentHistory, color }) => (
    <TimelineSection icon={<Briefcase size={16} />} title="Experience">
        {employmentHistory.map((exp, i) => (
            <TimelineItem key={i} title={exp.jobTitle} subtitle={exp.employer} period={`${exp.startDate} - ${exp.endDate}`} description={exp.description} color={color} />
        ))}
    </TimelineSection>
);
