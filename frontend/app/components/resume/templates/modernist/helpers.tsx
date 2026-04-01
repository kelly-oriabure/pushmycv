import React from 'react';

export const Section: React.FC<{ title: string; children: React.ReactNode; color: string }> = ({ title, children, color }) => (
    <section className="mb-6">
        <h2
            className="text-lg font-semibold uppercase tracking-wider pb-2 mb-4 border-b-2"
            style={{ borderColor: color, color: color }}
        >
            {title}
        </h2>
        {children}
    </section>
);

export const hasContent = (data: any): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    // If all items in the array are strings, check if any have content.
    if (data.every(item => typeof item === 'string')) {
      return data.some(item => item.trim() !== '');
    }
    // For arrays of objects, check if any object has content.
    return data.some(item => hasContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).some(([key, value]) => {
        // Exclude specific keys from the content check if necessary
        if (key === 'hideReferences') return false; 
        return hasContent(value);
    });
  }
  return false;
};
