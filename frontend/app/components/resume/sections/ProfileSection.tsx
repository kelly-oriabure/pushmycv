import React from 'react';
import { BaseSection, BaseSectionProps } from './BaseSection';

interface ProfileSectionProps extends Omit<BaseSectionProps, 'children'> {
  professionalSummary: string;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  professionalSummary,
  title = 'Profile',
  templateStyle,
  color
}) => {
  if (!professionalSummary || professionalSummary.trim() === '') return null;

  return (
    <BaseSection title={title} templateStyle={templateStyle} color={color}>
      <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: professionalSummary }} />
    </BaseSection>
  );
};