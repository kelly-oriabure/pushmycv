import React from 'react';
import type { PersonalDetailsData } from '@/lib/types';
import { getUserAvatarUrl } from '@/lib/utils/imageUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ArtisanHeaderProps {
    personalDetails: PersonalDetailsData;
    color: string;
}

export const ArtisanHeader: React.FC<ArtisanHeaderProps> = ({ personalDetails, color }) => {
    const fullName = `${personalDetails?.firstName || ''} ${personalDetails?.lastName || ''}`;
    const initials = `${personalDetails?.firstName?.charAt(0) || ''}${personalDetails?.lastName?.charAt(0) || ''}`;
    const photoSrc = getUserAvatarUrl(personalDetails?.photoUrl, personalDetails?.firstName, personalDetails?.lastName);
    const isMobile = useIsMobile();

    return (
        <header className="text-white" style={{ backgroundColor: color }}>
            <div className={`${isMobile ? 'p-4' : 'p-10'}`}>
                <div className={`flex items-center ${isMobile ? 'flex-col text-center gap-4' : 'justify-between'}`}>
                    <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-white bg-opacity-20 rounded-full flex items-center justify-center`}>
                        <img
                            src={photoSrc}
                            alt={fullName}
                            className={`rounded-full ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} object-cover border-2 border-white`}
                        />
                    </div>
                    <div className={isMobile ? 'text-center' : 'text-right'}>
                        <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-extrabold tracking-tight`}>{fullName}</h1>
                        <p className={`${isMobile ? 'text-base' : 'text-lg'} text-white text-opacity-80 mt-1`}>{personalDetails?.jobTitle || ''}</p>
                    </div>
                </div>
                <div className={`${isMobile ? 'mt-4' : 'mt-6'} border-t border-white border-opacity-30 pt-4 ${isMobile ? 'flex flex-col gap-2 text-center text-xs' : 'flex justify-end gap-6 text-xs'}`}>
                    {personalDetails?.email && <span>{personalDetails.email}</span>}
                    {personalDetails?.phone && <span>{personalDetails.phone}</span>}
                </div>
            </div>
        </header>
    );
};
