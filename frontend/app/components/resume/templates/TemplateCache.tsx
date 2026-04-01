import React, { memo, useMemo } from 'react';
import { templateMap } from './templateMap';
import type { ResumeData } from '@/lib/types';

interface TemplateCacheProps {
  templateId: string;
  color: string;
  data: ResumeData;
}

/**
 * Memoized template component that prevents unnecessary re-renders
 */
export const TemplateCache: React.FC<TemplateCacheProps> = memo(({ 
  templateId, 
  color, 
  data 
}) => {
  // Memoize the template component
  const TemplateComponent = useMemo(() => {
    return templateMap[templateId] || templateMap['cool'];
  }, [templateId]);

  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [
    data.personalDetails,
    data.professionalSummary,
    data.education?.length,
    data.employmentHistory?.length,
    data.skills?.length,
    data.references?.references.length,
    data.languages?.length,
    data.courses?.length,
    data.internships?.length,
  ]);

  if (!TemplateComponent) {
    return (
      <div className="w-full h-[29.7cm] bg-white flex flex-col items-center justify-center text-gray-400 border">
        <span className="text-lg">Template not available</span>
      </div>
    );
  }

  return <TemplateComponent color={color} data={memoizedData} />;
});

TemplateCache.displayName = 'TemplateCache';