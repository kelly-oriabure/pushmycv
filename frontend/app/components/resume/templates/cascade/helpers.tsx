import React from 'react';

// Helper to check if a section should be displayed
export const hasContent = (data: any): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    // For arrays of objects, check if any object has content. For arrays of strings, check if any string is non-empty.
    return data.some(item => hasContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    // For objects, check if any value has content, excluding specific keys like 'hideReferences'
    return Object.entries(data).some(([key, value]) => {
        if (key === 'hideReferences') return false; 
        return hasContent(value);
    });
  }
  return false;
};

export const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div>
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <h2 className="font-bold text-gray-800">{title}</h2>
        </div>
        <hr className="border-t-2 border-gray-300 mb-2" />
        {children}
    </div>
);

export const TimelineSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
            {icon}
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        <div className="relative border-l-2 border-gray-200 pl-6 space-y-8">
            {children}
        </div>
    </div>
);

export const TimelineItem: React.FC<{ title: string; subtitle: string; period: string; description: string, color: string }> = ({ title, subtitle, period, description, color }) => (
    <div className="relative">
        <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
        <p className="text-xs text-gray-500">{period}</p>
        <h3 className="font-bold text-base text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mb-1">{subtitle}</p>
        <p className="text-xs">{description}</p>
    </div>
);
