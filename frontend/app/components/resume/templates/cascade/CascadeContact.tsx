import React from 'react';
import type { PersonalDetailsData } from '@/lib/types';
import { Section } from './helpers';
import { Phone } from 'lucide-react';

interface CascadeContactProps {
    personalDetails: PersonalDetailsData;
}

export const CascadeContact: React.FC<CascadeContactProps> = ({ personalDetails }) => (
    <Section icon={<Phone size={14} />} title="Contact">
        <div className="space-y-1">
            <p>{personalDetails?.phone || ''}</p>
            <p>{personalDetails?.email || ''}</p>
            <p>{`${personalDetails?.address || ''}${personalDetails?.cityState ? ', ' + personalDetails.cityState : ''}`}</p>
        </div>
    </Section>
);
