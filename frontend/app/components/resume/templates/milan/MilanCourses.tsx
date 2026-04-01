import React from 'react';
import type { Course } from '@/lib/types';
import { Section } from './helpers';

interface MilanCoursesProps {
  courses: Course[];
  color?: string;
}

export const MilanCourses: React.FC<MilanCoursesProps> = ({ courses, color }) => (
  <Section title="Courses" color={color}>
    <div className="space-y-4">
      {courses.map((course, i) => (
        <div key={i}>
          <h3 className="font-semibold text-base">{course.course}</h3>
          <p className="text-gray-600 text-sm">{course.institution}</p>
          <p className="text-xs text-gray-500">{course.startDate} - {course.endDate}</p>
        </div>
      ))}
    </div>
  </Section>
);
