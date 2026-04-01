import React from 'react';
import type { InternshipsData } from '@/lib/types';
import { TimelineSection, TimelineItem } from './helpers';
import { ClipboardList } from 'lucide-react';

interface CascadeInternshipsProps {
    internships: InternshipsData;
    color: string;
}

export const CascadeInternships: React.FC<CascadeInternshipsProps> = ({ internships, color }) => (
    <TimelineSection icon={<ClipboardList size={16} />} title="Internships">
        {internships.map((internship, i) => (
            <TimelineItem key={i} title={internship.jobTitle} subtitle={internship.employer} period={`${internship.startDate} - ${internship.endDate}`} description="" color={color} />
        ))}
    </TimelineSection>
);
