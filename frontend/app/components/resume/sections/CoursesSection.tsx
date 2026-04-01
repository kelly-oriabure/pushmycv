import React from 'react';
import type { CoursesData } from '@/lib/types';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface CoursesSectionProps extends Omit<BaseSectionProps, 'children'> {
  courses: CoursesData;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ courses, title = 'Courses', templateStyle, color }) => {
  if (!Array.isArray(courses) || courses.length === 0) return null;

  const items = courses.filter(
    (course) =>
      Boolean(course?.course && course.course.trim() !== '') ||
      Boolean(course?.institution && course.institution.trim() !== '')
  );
  if (items.length === 0) return null;

  const containerClass =
    templateStyle?.layout === 'grid' ? (items.length > 1 ? 'grid grid-cols-2 gap-x-8 gap-y-4' : 'space-y-3') : 'space-y-3';

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      <div className={containerClass}>
        {items.map((course, index) => (
          <div key={index} className={templateStyle?.layout === 'grid' ? '' : 'mb-2'}>
            <h3 className="font-semibold text-base">{course.course}</h3>
            {course.institution && <p className="text-gray-600 text-sm">{course.institution}</p>}
            {(course.startDate || course.endDate) && (
              <p className="text-xs text-gray-500">
                {course.startDate} - {course.endDate}
              </p>
            )}
          </div>
        ))}
      </div>
    </BaseSection>
  );
};

