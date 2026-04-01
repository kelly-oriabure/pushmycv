import type { PersonalDetailsData } from '@/lib/types';
import React from 'react';

interface CascadeHeaderProps {
    personalDetails: PersonalDetailsData;
}

export const CascadeHeader: React.FC<CascadeHeaderProps> = ({ personalDetails }) => (
    <div className="relative z-10 flex flex-col items-center text-center">
        <img
            src={personalDetails?.photoUrl || '/placeholder.svg'}
            alt={`${personalDetails?.firstName || ''} ${personalDetails?.lastName || ''}`}
            className="rounded-full w-28 h-28 mb-4 border-4 border-white object-cover"
        />
        <h1 className="text-3xl font-bold text-gray-800">{`${personalDetails?.firstName || ''} ${personalDetails?.lastName || ''}`}</h1>
        <p className="text-gray-600">{personalDetails?.jobTitle || ''}</p>
    </div>
);
