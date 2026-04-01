import React from 'react';
import type { ResumeData } from '@/lib/types';
import { Section, SectionItem } from './CoolSection';

interface CoolCoursesProps {
  courses: ResumeData['courses'];
}

export const CoolCourses: React.FC<CoolCoursesProps> = ({ courses }) => (
  <Section title="Courses">
    {courses.map((course, index) => (
      <SectionItem
        key={index}
        title={course.course}
        subtitle={`${course.institution} | ${course.startDate} - ${course.endDate}`}
      />
    ))}
  </Section>
);
