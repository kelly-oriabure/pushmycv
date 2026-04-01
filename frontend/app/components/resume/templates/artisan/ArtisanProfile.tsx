import React from 'react';

interface ArtisanProfileProps {
    professionalSummary: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanProfile: React.FC<ArtisanProfileProps> = ({ professionalSummary }) => {
    return (
        <Section title="Profile">
            <p className="text-gray-700">{professionalSummary}</p>
        </Section>
    );
};
