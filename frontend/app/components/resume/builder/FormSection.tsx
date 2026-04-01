import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SectionNavigation } from './SectionNavigation';
import { AddSectionPanel } from './AddSectionPanel';
import type { ResumeData } from '@/lib/types';

interface SectionConfig {
  name: string;
  component: React.ComponentType<any>;
  displayName: string;
}

interface FormSectionProps {
  sections: SectionConfig[];
  currentIndex: number;
  resumeData: ResumeData;
  updateResumeData: (section: keyof ResumeData, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSectionChange: (index: number) => void;
  className?: string;
  resumeId: string;
  title?: string;
  resumeTitle?: string;
  templateId?: string; // Add templateId prop
  isExtracting?: boolean; // Add extraction loading state
}

export const FormSection: React.FC<FormSectionProps> = ({
  sections,
  currentIndex,
  resumeData,
  updateResumeData,
  onNext,
  onBack,
  onSectionChange,
  className = '',
  resumeId,
  title,
  resumeTitle,
  templateId, // Add templateId parameter
  isExtracting = false, // Add extraction loading state
}) => {
  const section = sections[currentIndex];
  const CurrentFormComponent = section.component;

  return (
    <div className={`bg-white m-2 ${className}`}>
      <div className="p-4 md:p-8">
        <Link href="/" className="hidden md:inline-flex items-center gap-2 mb-8 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <CurrentFormComponent
          onNext={onNext}
          onBack={onBack}
          currentStep={currentIndex + 1}
          totalSteps={sections.length}
          resumeData={resumeData}
          updateResumeData={updateResumeData}
          resumeId={resumeId}
          resumeTitle={resumeTitle}
          templateId={templateId} // Pass templateId to components
          isExtracting={isExtracting} // Pass extraction loading state
        />
        <SectionNavigation
          sections={sections}
          currentIndex={currentIndex}
          onSectionChange={onSectionChange}
        />
        {currentIndex === sections.length - 1 && <AddSectionPanel />}
      </div>
    </div>
  );
};
