import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
import { validateAndGetTemplate } from '@/lib/utils/templateUtils';
import type { ResumeData } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { RESUME_IDS } from '@/constants/resume';

interface ResumePreviewProps {
  templateId: string | null;
  color: string;
  data: ResumeData;
  zoomLevel: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
  colorPalette?: React.ReactNode; // <-- Add this prop
  exportButton?: React.ReactNode; // <-- Add this prop
  resumeId?: string | null; // <-- Add this prop
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  templateId,
  color,
  data,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  className = '',
  colorPalette,
  exportButton,
  resumeId
}) => {
  const isMobile = useIsMobile();
  const normalizedData = React.useMemo<ResumeData>(() => {
    const languagesRaw = (data as unknown as { languages?: unknown }).languages;
    const languages = Array.isArray(languagesRaw)
      ? languagesRaw
        .map((lang) => {
          if (typeof lang === 'string') return lang;
          if (typeof lang === 'object' && lang && 'name' in lang) {
            const name = (lang as { name?: unknown }).name;
            return typeof name === 'string' ? name : '';
          }
          return '';
        })
        .filter((v): v is string => Boolean(v))
      : [];

    return {
      ...data,
      languages,
    };
  }, [data]);

  // Get template component with enhanced validation and error handling
  const templateResult = validateAndGetTemplate(templateId);
  const { component: TemplateComponent, error, templateKey, isValid } = templateResult;


  // Log validation warnings
  if (!isValid && error) {
    console.warn(`Template validation failed: ${error}`);
  }

  // Create a ref to access the template element for PDF export
  const templateRef = React.useRef<HTMLDivElement>(null);

  const changeTemplateHref =
    resumeId === RESUME_IDS.TEMP
      ? '/template-selection'
      : resumeId && templateId
        ? `/template-selection/${templateId}?resumeId=${resumeId}&color=${encodeURIComponent(color)}`
        : '';

  return (
    <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
      <div className="w-full max-w-[21cm] mx-auto">
        {TemplateComponent && (
          <div className={`mb-4 ${isMobile ? 'space-y-3' : 'flex items-center justify-center gap-2'}`}>
            {/* First row on mobile: Change Template button and Export button */}
            <div className={`${isMobile ? 'flex justify-between items-center' : 'contents'}`}>
              {changeTemplateHref ? (
                <Link href={changeTemplateHref}>
                  <Button variant="outline" className={`${isMobile ? 'text-xs px-2 py-1' : 'px-3 py-2 text-sm'}`}>Change Template</Button>
                </Link>
              ) : null}
              {exportButton && (
                <div className="flex items-center gap-2">{exportButton}</div>
              )}
            </div>

            {/* Second row on mobile: Color palette */}
            {colorPalette && (
              <div className={`flex items-center justify-center gap-2 ${isMobile ? 'py-2' : ''}`}>{colorPalette}</div>
            )}

            {/* Third row on mobile: Zoom controls */}
            <div className={`flex items-center justify-center gap-2 ${isMobile ? '' : ''}`}>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground w-16 text-center border rounded-md bg-white py-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        <div
          className="resume-preview-stage transition-transform duration-300 flex items-center justify-center min-h-[600px]"
          style={TemplateComponent ? { transform: `scale(${zoomLevel})`, transformOrigin: 'top center' } : {}}
        >
          {TemplateComponent ? (
            <div
              ref={templateRef}
              data-resume-template
              data-template-key={templateKey || ''}
              className="a4-page overflow-visible print:transform-none print:scale-100 print:max-w-none print:p-0 bg-white"
              style={{ boxSizing: 'border-box' }}
            >
              <TemplateComponent key={templateId} color={color} data={normalizedData} templateKey={templateKey} />
            </div>
          ) : (
            <div className="w-full h-[29.7cm] max-w-[21cm] bg-white flex flex-col items-center justify-center text-gray-400 text-xl font-semibold border shadow-md mx-auto">
              {error ? (
                <>
                  <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
                  <span className="text-lg text-red-400 mb-2">Template Error</span>
                  <span className="text-sm text-gray-500 max-w-md text-center px-4">{error}</span>
                  <span className="text-xs text-gray-400 mt-2">Please select a template</span>
                </>
              ) : (
                <>
                  <span className="text-lg text-gray-400 mb-2">No Template Selected</span>
                  <span className="text-sm text-gray-500">Please select a template to continue</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export a function to get the template element for PDF generation
export const getResumeTemplateElement = (containerElement: HTMLElement | null): HTMLElement | null => {
  if (!containerElement) return null;

  // Look for the element with the data-resume-template attribute
  const templateElement = containerElement.querySelector('[data-resume-template]') as HTMLElement;

  // If not found, try to find the template component directly
  if (!templateElement) {
    return containerElement.querySelector('.resume-preview-stage [data-template-key]') as HTMLElement || containerElement;
  }

  // Prepare element for PDF export by ensuring any styling that might affect PDF generation
  // is properly set
  if (templateElement) {
    // Make sure the box-sizing is set to border-box
    if (!templateElement.style.boxSizing) {
      templateElement.style.boxSizing = 'border-box';
    }

    // Ensure the element has the correct dimensions for A4 paper
    if (!templateElement.style.width) {
      templateElement.style.width = '21cm';
    }

    if (!templateElement.style.height) {
      templateElement.style.height = '29.7cm';
    }

    // Ensure overflow is visible
    if (!templateElement.style.overflow) {
      templateElement.style.overflow = 'visible';
    }
  }

  return templateElement;
};

// Export the template ref for PDF generation
ResumePreview.displayName = 'ResumePreview';
