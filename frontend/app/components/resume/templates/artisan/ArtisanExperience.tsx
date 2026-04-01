import React from 'react';
import type { EmploymentHistoryData } from '@/lib/types';

interface ArtisanExperienceProps {
    employmentHistory: EmploymentHistoryData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanExperience: React.FC<ArtisanExperienceProps> = ({ employmentHistory }) => {
    return (
        <Section title="Experience">
            <div className="space-y-6">
                {employmentHistory.map((job) => (
                    <div key={job.id}>
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-semibold text-base">{job.employer}</h3>
                            <span className="text-xs text-gray-500 font-medium">{`${job.startDate} - ${job.endDate}`}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{job.jobTitle}</p>
                        <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1 text-xs">
                            {job.description.split('\n').map((desc, j) => desc && <li key={j}>{desc.replace(/^- /, '')}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </Section>
    );
};
