import React from 'react';
import type { EducationData } from '@/lib/types';

interface ArtisanEducationProps {
    education: EducationData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanEducation: React.FC<ArtisanEducationProps> = ({ education }) => {
    return (
        <Section title="Education">
            {education.map((edu, index) => (
                <div key={index} className="mb-4">
                    <h3 className="font-semibold text-base">{edu.degree}</h3>
                    <p className="text-gray-600 text-sm">{edu.school}</p>
                    <p className="text-xs text-gray-500">{`${edu.startDate} - ${edu.endDate}`}</p>
                </div>
            ))}
        </Section>
    );
};
