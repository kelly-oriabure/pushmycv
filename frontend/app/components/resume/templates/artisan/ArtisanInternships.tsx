import React from 'react';
import type { InternshipsData } from '@/lib/types';

interface ArtisanInternshipsProps {
    internships: InternshipsData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanInternships: React.FC<ArtisanInternshipsProps> = ({ internships }) => {
    if (!internships || internships.length === 0) return null;

    return (
        <Section title="Internships">
            <div className="space-y-4">
                {internships.map((internship, i) => (
                    <div key={i}>
                        <h3 className="font-semibold text-base">{internship.jobTitle}</h3>
                        <p className="text-gray-600 text-sm">{internship.employer}</p>
                        <p className="text-xs text-gray-500">{`${internship.startDate} - ${internship.endDate}`}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
};
