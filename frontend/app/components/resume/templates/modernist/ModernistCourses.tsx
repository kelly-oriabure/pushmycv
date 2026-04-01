import React from 'react';
import type { CoursesData } from '@/lib/types';
import { Section } from './helpers';

interface ModernistCoursesProps {
  courses: CoursesData;
  color: string;
}

export const ModernistCourses: React.FC<ModernistCoursesProps> = ({ courses, color }) => (
  Array.isArray(courses) && courses.length > 0 ? (
    <Section title="Courses" color={color}>
      <div className="space-y-4">
        {courses.map((course, i) => (
          <div key={i}>
            <h3 className="font-semibold text-base">{course?.course || ''}</h3>
            <p className="text-gray-600 text-sm">{course?.institution || ''}</p>
            <p className="text-xs text-gray-500">{course?.startDate || ''} - {course?.endDate || ''}</p>
          </div>
        ))}
      </div>
    </Section>
  ) : null
);
