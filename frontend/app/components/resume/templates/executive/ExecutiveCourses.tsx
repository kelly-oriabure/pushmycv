import React from 'react';
import type { CoursesData } from '@/lib/types';
import { Section } from './helpers';

interface ExecutiveCoursesProps {
  courses: CoursesData;
}

export const ExecutiveCourses: React.FC<ExecutiveCoursesProps> = ({ courses }) => (
  <Section title="Courses">
    {courses.map((course, index) => (
      <div key={index} className="mb-3">
        <h3 className="font-bold text-sm">{course.course} - {course.institution}</h3>
        <p className="text-xs text-gray-500">{course.startDate} - {course.endDate}</p>
      </div>
    ))}
  </Section>
);
