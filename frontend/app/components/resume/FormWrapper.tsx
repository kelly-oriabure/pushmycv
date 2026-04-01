'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useResumeBuilder } from '@/hooks/useResumeBuilder';
import { useResumeStore } from '@/store/resumeStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useResumeBuilderHeaderActions } from '@/components/resume/builder/ResumeBuilderHeaderActionsContext';

interface FormWrapperProps {
  title: string;
  description: string;
  resumeScore: number;
  scoreBonus: number;
  scoreText: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextButtonText?: string;
  children: React.ReactNode;
  resumeId: string;
  resumeTitle?: string;
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  description,
  resumeScore,
  scoreBonus,
  scoreText,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextButtonText = 'Next',
  children,
  resumeId,
  resumeTitle,
}) => {
  console.log('FormWrapper resumeTitle:', resumeTitle); // Debug log
  const router = useRouter();
  const [templateId, setTemplateId] = useState('cool');
  const [color, setColor] = useState('#64748b');
  const [localTitle, setLocalTitle] = useState(resumeTitle || 'Untitled Resume');
  const { updateResumeTitle } = useResumeStore();
  const isMobile = useIsMobile();
  const { headerRight } = useResumeBuilderHeaderActions();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setTemplateId(searchParams.get('templateId') || 'cool');
      setColor(searchParams.get('color') || '#64748b');
    }
  }, []);

  useEffect(() => {
    setLocalTitle(resumeTitle || 'Untitled Resume');
  }, [resumeTitle]);

  const debouncedSave = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      return (title: string) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(async () => {
          if (resumeId && title.trim()) {
            try {
              await updateResumeTitle(resumeId, title.trim());
            } catch (error) {
              console.error('Failed to update resume title:', error);
            }
          }
          timeoutId = null;
        }, 500);
      };
    })(),
    [resumeId, updateResumeTitle]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    debouncedSave(newTitle);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="bg-primary/80 text-white px-3 py-1 rounded-md font-semibold text-sm">
              {resumeScore}%
            </span>
            {/* <span className="text-gray-600">Your resume score</span> */}
          </div>
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              value={localTitle}
              onChange={handleTitleChange}
              className="text-normal font-semibold text-gray-900 border-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-center flex-1"
              placeholder="Enter resume title"
            />
            <Edit3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 text-green-600">
              <span className="font-semibold">+{scoreBonus}%</span>
            </div>
            {headerRight ? <div className="flex items-center gap-2">{headerRight}</div> : null}
          </div>
        </div>

        <Progress value={(currentStep / totalSteps) * 100} className="h-2 [&>div]:bg-primary" />
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg p-4 md:p-8 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>

        <div className="mb-8">
          {children}
        </div>

        {/* Navigation buttons */}
        <div className={`pt-6 border-t ${isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-[auto_1fr_auto] items-center'}`}>
          {/* Back button */}
          <div className={`${isMobile ? '' : ''}`}>
            <Button
              variant="outline"
              onClick={onBack}
              disabled={currentStep === 1}
              className={`${isMobile ? 'w-full px-6' : 'px-8'}`}
            >
              Back
            </Button>
          </div>

          {/* Center progress dots on desktop; inline on mobile */}
          <div className={`flex items-center gap-2 ${isMobile ? 'order-last justify-center' : 'justify-center'}`}>
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index < currentStep ? 'bg-secondary' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Next/End button */}
          <div className={`${isMobile ? 'w-full' : 'justify-self-end'}`}>
            {currentStep === totalSteps ? (
              <Button
                onClick={() => {
                  const params = new URLSearchParams();
                  params.append('resumeId', resumeId);
                  params.append('templateId', templateId);
                  params.append('color', color);
                  // router.push(`/review-template?${params.toString()}`);
                }}
                className={`${isMobile ? 'w-full px-6' : 'px-8'} bg-black text-white`}
              >
                End
              </Button>
            ) : (
              <Button
                onClick={onNext}
                className={`${isMobile ? 'w-full px-6' : 'px-8'} bg-primary hover:bg-primary/80`}
              >
                {nextButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
