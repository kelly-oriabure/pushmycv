import React from 'react';
import type { CoursesData } from '@/lib/types';

interface ArtisanCoursesProps {
    courses: CoursesData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanCourses: React.FC<ArtisanCoursesProps> = ({ courses }) => {
    if (!courses || courses.length === 0) return null;

    return (
        <Section title="Courses">
            <div className={courses.length > 1 ? "grid grid-cols-2 gap-x-6" : ""}>
                {courses.map((course, i) => (
                    <div key={i} className="mb-2">
                        <h3 className="font-semibold text-base">{course.course}</h3>
                        <p className="text-gray-600 text-sm">{course.institution}</p>
                        <p className="text-xs text-gray-500">{`${course.startDate} - ${course.endDate}`}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
};
