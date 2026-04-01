import React from 'react';
import type { ReferencesData } from '@/lib/types';

interface ArtisanReferencesProps {
    references: ReferencesData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
        {children}
    </section>
);

export const ArtisanReferences: React.FC<ArtisanReferencesProps> = ({ references }) => {
    if (references.hideReferences || !references.references || references.references.length === 0) return null;

    return (
        <Section title="References">
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                {references.references.map((ref, i) => (
                    <div key={i}>
                        <h3 className="font-semibold text-base">{ref.name}</h3>
                        <p className="text-gray-600 text-sm">{ref.company}</p>
                        <p className="text-xs text-gray-500">{ref.phone} | {ref.email}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
};
