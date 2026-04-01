import React from 'react';
import { Phone, Mail } from 'lucide-react';
import type { PersonalDetailsData } from '@/lib/types';

interface SimpleWhiteHeaderProps {
  personalDetails: PersonalDetailsData;
}

export const SimpleWhiteHeader: React.FC<SimpleWhiteHeaderProps> = ({ personalDetails }) => {
  const fullName = `${personalDetails.firstName} ${personalDetails.lastName}`.trim();

  return (
    <header className="flex items-center justify-between pb-8 border-b-2 border-gray-200">
      <div className="flex items-center">
        <img src={personalDetails.photoUrl || '/placeholder.svg'} alt={fullName} className="w-24 h-24 rounded-full mr-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-wider">{fullName}</h1>
          <p className="text-lg text-gray-500 tracking-widest">{personalDetails.jobTitle}</p>
        </div>
      </div>
      <div className="text-right text-xs">
        {personalDetails.phone && (
          <div className="flex items-center justify-end mb-1">
            <span className="mr-2">{personalDetails.phone}</span>
            <Phone className="w-3 h-3 text-gray-600" />
          </div>
        )}
        {personalDetails.email && (
          <div className="flex items-center justify-end mb-1">
            <span className="mr-2">{personalDetails.email}</span>
            <Mail className="w-3 h-3 text-gray-600" />
          </div>
        )}
      </div>
    </header>
  );
};
