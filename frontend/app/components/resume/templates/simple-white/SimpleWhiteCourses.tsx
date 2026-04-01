import React from 'react';
import type { CoursesData } from '@/lib/types';
import { Section } from './helpers';

interface SimpleWhiteCoursesProps {
  courses: CoursesData;
}

export const SimpleWhiteCourses: React.FC<SimpleWhiteCoursesProps> = ({ courses }) => (
  <Section title="COURSES">
    {courses.map((course, i) => (
      <div key={i} className="mb-4">
        <p className="font-bold text-sm">{course.course}</p>
        <p>{course.institution}</p>
        <p className="text-gray-500">{course.startDate} - {course.endDate}</p>
      </div>
    ))}
  </Section>
);
