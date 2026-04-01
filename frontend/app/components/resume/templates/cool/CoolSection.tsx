import React from 'react';

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="font-bold text-base mb-2 tracking-widest uppercase" style={{ color: '#374151' }}>
      {title}
    </h3>
    {children}
  </div>
);

export const SectionItem: React.FC<{ title: string; subtitle?: string; description?: string }> = ({ title, subtitle, description }) => (
  <div className="mb-4">
    <h4 className="font-semibold text-sm">{title}</h4>
    {subtitle && <p className="text-xs text-gray-600 italic">{subtitle}</p>}
    {description && <p className="text-xs mt-1 text-gray-700">{description}</p>}
  </div>
);
