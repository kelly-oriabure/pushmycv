import React from 'react';
import { Section } from './helpers';
import { User } from 'lucide-react';

interface CascadeAboutProps {
    professionalSummary: string;
}

export const CascadeAbout: React.FC<CascadeAboutProps> = ({ professionalSummary }) => (
    <Section icon={<User size={14} />} title="About Me">
        <p>{professionalSummary}</p>
    </Section>
);
