import React from 'react';
import type { CoursesData } from '@/lib/types';
import { TimelineSection, TimelineItem } from './helpers';
import { BookOpen } from 'lucide-react';

interface CascadeCoursesProps {
    courses: CoursesData;
    color: string;
}

export const CascadeCourses: React.FC<CascadeCoursesProps> = ({ courses, color }) => (
    <TimelineSection icon={<BookOpen size={16} />} title="Courses">
        {courses.map((course, i) => (
            <TimelineItem key={i} title={course.course} subtitle={course.institution} period={`${course.startDate} - ${course.endDate}`} description="" color={color} />
        ))}
    </TimelineSection>
);
