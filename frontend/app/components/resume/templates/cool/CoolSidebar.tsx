import React from 'react';
import type { ResumeData } from '@/lib/types';
import { getFullName, hasContent } from './helpers';
import { getUserAvatarUrl } from '@/lib/utils/imageUtils';

interface CoolSidebarProps {
  personalDetails: ResumeData['personalDetails'];
  skills: ResumeData['skills'];
  languages: Array<string | { name?: string | null }>;
  isMobile?: boolean;
}

export const CoolSidebar: React.FC<CoolSidebarProps> = ({ personalDetails, skills, languages, isMobile = false }) => {
  const fullName = getFullName(personalDetails);
  const hasContactInfo = hasContent(personalDetails.phone) || hasContent(personalDetails.email) || hasContent(personalDetails.address) || hasContent(personalDetails.country);
  const hasSkills = hasContent(skills);
  const hasLanguages = hasContent(languages);
  const avatarUrl = getUserAvatarUrl(personalDetails.photoUrl, personalDetails.firstName, personalDetails.lastName);
  const getLanguageText = (lang: string | { name?: string | null }) =>
    typeof lang === 'string' ? lang : (lang?.name ?? '');

  return (
    <>
      {/* Avatar - responsive for mobile */}
      <div className={`flex ${isMobile ? 'flex-row items-center gap-4' : 'flex-col items-center mb-6'}`}>
        <div className={`rounded-lg ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} object-cover border-4 border-white ${isMobile ? 'mb-0' : 'mb-4'} bg-gray-200 flex items-center justify-center`}>
          <img
            src={avatarUrl}
            alt={fullName || 'Avatar'}
            className={`rounded-lg ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} object-cover`}
          />
        </div>
        <div className={isMobile ? 'text-left' : 'text-center'}>
          <div className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} leading-tight min-h-[1.5em]`}>{fullName || ''}</div>
          <div className="text-xs tracking-widest font-medium min-h-[1em]">{personalDetails.jobTitle || ''}</div>
        </div>
      </div>

      {/* Contact - hidden on mobile for space efficiency */}
      {hasContactInfo && !isMobile && (
        <div className="mb-6">
          <div className="font-bold text-sm mb-2 tracking-widest">CONTACT</div>
          <div className="space-y-2 text-xs">
            {personalDetails.phone && <div>{personalDetails.phone}</div>}
            {personalDetails.email && <div>{personalDetails.email}</div>}
            {personalDetails.address && <div>{personalDetails.address}</div>}
            {personalDetails.country && <div>{personalDetails.country}</div>}
          </div>
        </div>
      )}

      {/* Skills - simplified on mobile */}
      {hasSkills && !isMobile && (
        <div className="mb-6">
          <div className="font-bold text-sm mb-2 tracking-widest">SKILLS</div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            {skills.map((skill, i) => skill.name && <li key={i}>{skill.name}</li>)}
          </ul>
        </div>
      )}

      {/* Languages - simplified on mobile */}
      {hasLanguages && !isMobile && (
        <div className="mb-6">
          <div className="font-bold text-sm mb-2 tracking-widest">LANGUAGES</div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            {languages.map((lang, i) => {
              const text = getLanguageText(lang);
              return text ? <li key={i}>{text}</li> : null;
            })}
          </ul>
        </div>
      )}
    </>
  );
};
