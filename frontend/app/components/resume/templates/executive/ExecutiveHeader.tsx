import React from 'react';
import type { PersonalDetailsData } from '@/lib/types';

interface ExecutiveHeaderProps {
  personalDetails: PersonalDetailsData;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({ personalDetails }) => {
  const fullName = `${personalDetails.firstName} ${personalDetails.lastName}`.trim();

  return (
    <>
      {personalDetails.photoUrl && (
        <img src={personalDetails.photoUrl} alt={fullName} className="rounded-full w-24 h-24 mx-auto mb-4 border-4 border-white" />
      )}
      <h1 className="text-2xl font-bold text-center">{fullName}</h1>
      <p className="text-center uppercase tracking-wider text-xs mb-6">{personalDetails.jobTitle}</p>

      <div>
        <h2 className="text-md font-bold uppercase tracking-wider mb-3">Details</h2>
        <div className="text-xs space-y-2 mb-6 whitespace-pre-line">
          <p>{personalDetails.address}</p>
          <p>{personalDetails.cityState}</p>
          <p>{personalDetails.country}</p>
          <p>{personalDetails.phone}</p>
          <p>{personalDetails.email}</p>
        </div>
      </div>
    </>
  );
};
