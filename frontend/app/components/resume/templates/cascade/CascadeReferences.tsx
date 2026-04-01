import React from 'react';
import type { ReferencesData } from '@/lib/types';
import { Section } from './helpers';
import { Users } from 'lucide-react';

interface CascadeReferencesProps {
    references: ReferencesData;
}

export const CascadeReferences: React.FC<CascadeReferencesProps> = ({ references }) => (
    <>
        {!references.hideReferences && (
            <Section icon={<Users size={16} />} title="References">
                <div className="grid grid-cols-2 gap-4 text-xs">
                    {references.references.map((ref, i) => (
                        <div key={i}>
                            <p className="font-bold">{ref.name}</p>
                            <p className="text-gray-600">{ref.company || ''}</p>
                            <p>{ref.phone || ''}</p>
                            <p>{ref.email || ''}</p>
                        </div>
                    ))}
                </div>
            </Section>
        )}
    </>
);
