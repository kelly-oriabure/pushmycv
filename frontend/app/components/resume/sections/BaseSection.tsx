import React from 'react';

export interface BaseSectionProps {
  title: string;
  children: React.ReactNode;
  templateStyle?: SectionStyleConfig;
  color?: string;
}

export interface SectionStyleConfig {
  titleStyle?: 'bold-uppercase' | 'colored-border' | 'minimal' | 'boxed';
  layout?: 'list' | 'grid' | 'timeline';
  spacing?: 'compact' | 'normal' | 'spacious';
  containerClass?: string;
  titleClass?: string;
}

export const BaseSection: React.FC<BaseSectionProps> = ({
  title,
  children,
  templateStyle,
  color = '#3b82f6'
}) => {
  const getTitleClass = () => {
    switch (templateStyle?.titleStyle) {
      case 'bold-uppercase':
        return 'font-bold text-base mb-2 mt-6 tracking-widest uppercase';
      case 'colored-border':
        return 'text-lg font-semibold uppercase tracking-wider pb-2 mb-4 border-b-2';
      case 'boxed':
        return 'font-bold text-sm px-3 py-2 my-2 inline-block rounded';
      default:
        return 'font-semibold text-base mb-3';
    }
  };

  const getContainerClass = () => {
    const spacingClass = templateStyle?.spacing === 'compact'
      ? 'space-y-2'
      : templateStyle?.spacing === 'spacious'
        ? 'space-y-4'
        : 'space-y-2';

    return `${templateStyle?.containerClass || ''} ${spacingClass}`;
  };

  const titleStyle = templateStyle?.titleStyle === 'colored-border'
    ? { borderColor: color, color: color }
    : templateStyle?.titleStyle === 'boxed'
      ? { backgroundColor: color, color: 'white' }
      : {};

  return (
    <section className={getContainerClass()}>
      <h2
        className={getTitleClass()}
        style={titleStyle}
      >
        {title}
      </h2>
      {children}
    </section>
  );
};