import React from 'react';
import type { PersonalDetailsData } from '@/lib/types';

interface ModernistHeaderProps {
  personalDetails: PersonalDetailsData;
}

export const ModernistHeader: React.FC<ModernistHeaderProps> = ({ personalDetails }) => {
  const firstName = personalDetails?.firstName || '';
  const lastName = personalDetails?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const fullAddress = [
    personalDetails?.address,
    personalDetails?.cityState,
    personalDetails?.country,
  ].filter(Boolean).join(', ');

  return (
    <header className="text-center mb-10 print:w-full print:m-0 print:p-0 print:max-w-none" data-pdf-header>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">{fullName || 'Name'}</h1>
      <p className="text-lg text-gray-600 mt-1">{personalDetails?.jobTitle || ''}</p>
      <div className="flex flex-col items-center gap-1 text-xs mt-4 text-gray-500">
        <div className="flex items-center gap-x-4">
          {personalDetails?.phone && <span>{personalDetails.phone}</span>}
          {personalDetails?.phone && personalDetails?.email && <span>&bull;</span>}
          {personalDetails?.email && <span>{personalDetails.email}</span>}
        </div>
        {fullAddress && <div>{fullAddress}</div>}
      </div>
    </header>
  );
};