import React from 'react';
import type { ResumeData } from '@/lib/types';
import { validateAndGetTemplate } from '@/lib/utils/templateUtils';

interface ResumePreviewProps {
    templateId: string;
    color: string;
    data: ResumeData;
    className?: string;
}

export const SelectionPreview: React.FC<ResumePreviewProps> = ({
    templateId,
    color,
    data,
    className = ''
}) => {
    // Get template component with enhanced validation and error handling
    const templateResult = validateAndGetTemplate(templateId);
    const { component: TemplateComponent, error, isValid } = templateResult;
    
    if (!isValid && error) {
        console.warn(`SelectionPreview - Template validation failed: ${error}`);
    }

    return (
        <div className={`flex-1 overflow-y-auto bg-[#e2e8f0] shadow-md ${className}`}>
            <div className="w-full max-w-[21cm] mx-auto">
                <div className="transition-transform duration-300">
                    {TemplateComponent ? (
                        <TemplateComponent key={templateId} color={color} data={data} />
                    ) : (
                        <div className="w-full h-[29.7cm] bg-white flex flex-col items-center justify-center text-gray-400 border">
                            <span className="text-lg">Template not available</span>
                            {error && <span className="text-sm mt-2 text-center px-4">{error}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
