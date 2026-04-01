import React from 'react';

export const Section: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
  <div className={`mb-6 ${className}`}>
    <h2 className="text-sm font-bold text-gray-500 tracking-widest mb-4">{title}</h2>
    {children}
  </div>
);

export const hasContent = (data: any): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    if (data.every(item => typeof item === 'string')) {
      return data.some(item => item.trim() !== '');
    }
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
