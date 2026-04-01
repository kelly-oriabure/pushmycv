import React from 'react';

export const hasContent = (data: any): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    return data.some(item => hasContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).some(([key, value]) => {
        if (key === 'hideReferences') return false; 
        return hasContent(value);
    });
  }
  return false;
};

export const Section: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
  <div className={`mb-6 ${className}`}>
    <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-3 uppercase tracking-wider">{title}</h2>
    {children}
  </div>
);

export const SkillBar: React.FC<{ skill: string; level: number }> = ({ skill, level }) => (
  <div className="mb-3">
    <p className="text-sm font-medium">{skill}</p>
    <div className="w-full bg-gray-600 h-1.5 mt-1">
      <div className="bg-white h-1.5" style={{ width: `${level}%` }}></div>
    </div>
  </div>
);
