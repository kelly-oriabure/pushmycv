import React from 'react';
import type { PersonalDetailsData } from '@/lib/types';

interface MilanHeaderProps {
  personalDetails: PersonalDetailsData;
}

export const MilanHeader: React.FC<MilanHeaderProps> = ({ personalDetails }) => {
  const fullName = `${personalDetails.firstName} ${personalDetails.lastName}`.trim();

  return (
    <>
      {personalDetails.photoUrl && (
        <img
          src={personalDetails.photoUrl}
          alt={fullName}
          className="rounded-full w-32 h-32 mx-auto mb-6 border-4 border-white border-opacity-50"
          crossOrigin="anonymous"
        />
      )}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">{fullName}</h1>
        <p className="text-sm opacity-80 mt-1">{personalDetails.jobTitle}</p>
<p className="text-xs opacity-70 mt-2">{personalDetails.cityState} | {personalDetails.country}</p>
      </div>
    </>
  );
};
