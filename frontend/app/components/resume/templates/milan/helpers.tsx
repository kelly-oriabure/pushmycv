import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const Section: React.FC<SectionProps> = ({ title, children, className, color = '#800000' }) => (
  <section className={`mb-8 ${className}`}>
    <h2 className="text-lg font-bold uppercase tracking-widest mb-4" style={{ color: color }}>
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
      return data.some(item => hasContent(item));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).some(([key, value]) => {
          if (key === 'hideReferences' || key === 'photoUrl') return false; 
          return hasContent(value);
      });
    }
    return false;
};
