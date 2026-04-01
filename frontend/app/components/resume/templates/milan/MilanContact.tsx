import React from 'react';
import type { PersonalDetailsData } from '@/lib/types';

interface MilanContactProps {
  personalDetails: PersonalDetailsData;
}

export const MilanContact: React.FC<MilanContactProps> = ({ personalDetails }) => (
  <div>
    <h2 className="font-bold uppercase tracking-wider mb-2 opacity-80">Contact</h2>
    <div className="space-y-1 opacity-90">
      <p>{personalDetails.phone}</p>
      <p>{personalDetails.email}</p>
      <p>{personalDetails.address}, {personalDetails.cityState}, {personalDetails.country}</p>
    </div>
  </div>
);
