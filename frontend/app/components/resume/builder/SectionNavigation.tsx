
import React from 'react';

interface SectionConfig {
  name: string;
  component: React.ComponentType<any>;
  displayName: string;
}

interface SectionNavigationProps {
  sections: SectionConfig[];
  currentIndex: number;
  onSectionChange: (index: number) => void;
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  currentIndex,
  onSectionChange
}) => {
  return (
    <nav className="flex flex-wrap justify-center gap-2 mt-8 mb-2">
      {sections.map((section, idx) => (
        <button
          key={section.name}
          onClick={() => onSectionChange(idx)}
          className={`px-3 py-1 rounded font-medium transition-colors text-sm
            ${currentIndex === idx ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
        >
          {section.name}
        </button>
      ))}
    </nav>
  );
};
