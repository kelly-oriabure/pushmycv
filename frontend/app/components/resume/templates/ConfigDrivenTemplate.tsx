'use client';
import React from 'react';
import { dummyResumeData } from '@/data/dummyData';
import type { ResumeData } from '@/lib/types';
import { getTemplateDefinition } from './config/registry';
import type {
  TemplateLayoutDefinition,
  TemplateRegionDefinition,
  TemplateRenderContext,
  TemplateSectionDefinition
} from './config/types';
import { SectionRenderer } from '@/components/resume/sections/SectionRenderer';
import { ArtisanHeader } from './artisan/ArtisanHeader';
import { ArtisanCourses } from './artisan/ArtisanCourses';
import { CascadeHeader } from './cascade/CascadeHeader';
import { CascadeContact } from './cascade/CascadeContact';
import { CascadeSkills } from './cascade/CascadeSkills';
import { CascadeLanguages } from './cascade/CascadeLanguages';
import { CascadeCourses } from './cascade/CascadeCourses';
import { CascadeReferences } from './cascade/CascadeReferences';
import { ExecutiveHeader } from './executive/ExecutiveHeader';
import { ExecutiveSkills } from './executive/ExecutiveSkills';
import { ExecutiveLanguages } from './executive/ExecutiveLanguages';
import { ExecutiveCourses } from './executive/ExecutiveCourses';
import { MilanHeader } from './milan/MilanHeader';
import { MilanContact } from './milan/MilanContact';
import { MilanSkills } from './milan/MilanSkills';
import { MilanLanguages } from './milan/MilanLanguages';
import { MilanCourses } from './milan/MilanCourses';
import { ModernistHeader } from './modernist/ModernistHeader';
import { ModernistLanguages } from './modernist/ModernistLanguages';
import { ModernistCourses } from './modernist/ModernistCourses';
import { CoolSidebar } from './cool/CoolSidebar';
import { SimpleWhiteHeader } from './simple-white/SimpleWhiteHeader';
import { SimpleWhiteSidebar } from './simple-white/SimpleWhiteSidebar';
import { SimpleWhiteCourses } from './simple-white/SimpleWhiteCourses';
import { SimpleWhiteLanguages } from './simple-white/SimpleWhiteLanguages';

interface ConfigDrivenTemplateProps {
  data?: ResumeData;
  color?: string;
  templateKey?: string;
}

type SectionOverride = (section: TemplateSectionDefinition, ctx: TemplateRenderContext) => React.ReactNode;

const SECTION_OVERRIDES: Record<string, Partial<Record<string, SectionOverride>>> = {
  artisan: {
    header: (_section, ctx) => <ArtisanHeader personalDetails={ctx.data.personalDetails} color={ctx.color || '#4a5568'} />,
    courses: (_section, ctx) => <ArtisanCourses courses={ctx.data.courses} />,
    references: (_section, ctx) => {
      const refs = ctx.data.references;
      const items = refs?.references;
      const shouldShow = Array.isArray(items) && items.length > 0;
      if (!shouldShow) return null;
      const dataWithRefsVisible: ResumeData = { ...ctx.data, references: { ...refs, hideReferences: false } };
      return (
        <SectionRenderer
          sectionType="references"
          data={dataWithRefsVisible}
          templateKey={ctx.templateKey}
          color={ctx.color}
        />
      );
    }
  },
  cascade: {
    sidebar: (_section, ctx) => {
      const personalDetails = ctx.data.personalDetails;
      const skills = ctx.data.skills;
      const languages = ctx.data.languages;
      const p = personalDetails;
      const hasContact =
        Boolean(p?.phone) || Boolean(p?.email) || Boolean(p?.address) || Boolean(p?.cityState);

      return (
        <aside className="w-[38%] bg-gray-100 p-8 flex flex-col relative">
          <div
            className="absolute top-0 left-0 w-full h-1/3"
            style={{
              backgroundColor: ctx.color || '#3b82f6',
              clipPath: 'polygon(0px 0px, 50% 0px, 100% 0%, 0px 70%)'
            }}
          />
          <CascadeHeader personalDetails={personalDetails} />
          <div className="mt-8 space-y-6 text-xs">
            {hasContact && <CascadeContact personalDetails={personalDetails} />}
            {ctx.data.professionalSummary && (
              <SectionRenderer sectionType="profile" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />
            )}
            {Array.isArray(skills) && skills.length > 0 && <CascadeSkills skills={skills} />}
            {Array.isArray(languages) && languages.length > 0 && <CascadeLanguages languages={languages} />}
          </div>
        </aside>
      );
    },
    courses: (_section, ctx) => <CascadeCourses courses={ctx.data.courses} color={ctx.color || '#3b82f6'} />,
    references: (_section, ctx) => <CascadeReferences references={ctx.data.references} />
  },
  cool: {
    sidebar: (_section, ctx) => (
      <div className="section w-1/3 p-6 text-white flex flex-col gap-8" style={{ backgroundColor: ctx.color || '#232c3d' }}>
        <CoolSidebar personalDetails={ctx.data.personalDetails} skills={ctx.data.skills} languages={ctx.data.languages} isMobile={false} />
      </div>
    )
  },
  executive: {
    sidebar: (_section, ctx) => {
      const personalDetails = ctx.data.personalDetails;
      const skills = ctx.data.skills;
      const languages = ctx.data.languages;

      return (
        <div className="w-1/3 text-white p-6 print:p-4" style={{ backgroundColor: ctx.color || '#334155' }}>
          {personalDetails && <ExecutiveHeader personalDetails={personalDetails} />}
          {Array.isArray(skills) && skills.length > 0 && <ExecutiveSkills skills={skills} />}
          {Array.isArray(languages) && languages.length > 0 && <ExecutiveLanguages languages={languages} />}
        </div>
      );
    },
    courses: (_section, ctx) => <ExecutiveCourses courses={ctx.data.courses} />
  },
  milan: {
    sidebar: (_section, ctx) => {
      const personalDetails = ctx.data.personalDetails;
      const skills = ctx.data.skills;
      const languages = ctx.data.languages;

      return (
        <aside className="w-1/3 text-white p-8" style={{ backgroundColor: ctx.color || '#800000' }}>
          {personalDetails && <MilanHeader personalDetails={personalDetails} />}
          <div className="space-y-6 text-xs">
            {personalDetails && <MilanContact personalDetails={personalDetails} />}
            {Array.isArray(skills) && skills.length > 0 && <MilanSkills skills={skills} />}
            {Array.isArray(languages) && languages.length > 0 && <MilanLanguages languages={languages} />}
          </div>
        </aside>
      );
    },
    courses: (_section, ctx) => <MilanCourses courses={ctx.data.courses} color={ctx.color || '#800000'} />
  },
  modernist: {
    header: (_section, ctx) => <ModernistHeader personalDetails={ctx.data.personalDetails} />,
    courses: (_section, ctx) => <ModernistCourses courses={ctx.data.courses} color={ctx.color || '#3b82f6'} />,
    languages: (_section, ctx) => <ModernistLanguages languages={ctx.data.languages} color={ctx.color || '#3b82f6'} />
  },
  'simple-white': {
    header: (_section, ctx) => <SimpleWhiteHeader personalDetails={ctx.data.personalDetails} />,
    sidebar: (_section, ctx) => (
      <SimpleWhiteSidebar personalDetails={ctx.data.personalDetails} skills={ctx.data.skills} languages={ctx.data.languages} />
    ),
    courses: (_section, ctx) => <SimpleWhiteCourses courses={ctx.data.courses} />,
    languages: (_section, ctx) => <SimpleWhiteLanguages languages={ctx.data.languages} />
  }
};

const renderSection = (section: TemplateSectionDefinition, ctx: TemplateRenderContext) => {
  if (section.when && !section.when(ctx)) return null;

  if (section.type === 'container') {
    const className = typeof section.props?.className === 'string' ? section.props.className : '';
    return (
      <div className={className}>
        {section.children?.map((child, idx) => (
          <React.Fragment key={`${child.type}-${idx}`}>{renderSection(child, ctx)}</React.Fragment>
        ))}
      </div>
    );
  }

  const override = SECTION_OVERRIDES[ctx.templateKey]?.[section.type];
  if (override) {
    return override(section, ctx);
  }

  switch (section.type) {
    case 'header':
      return null;
    case 'sidebar':
      return null;
    case 'profile':
      return <SectionRenderer sectionType="profile" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />;
    case 'experience':
      return (
        <SectionRenderer sectionType="experience" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />
      );
    case 'education':
      return (
        <SectionRenderer sectionType="education" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />
      );
    case 'skills':
      return <SectionRenderer sectionType="skills" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />;
    case 'languages':
      return <SectionRenderer sectionType="languages" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />;
    case 'courses':
      return <SectionRenderer sectionType="courses" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />;
    case 'internships':
      return (
        <SectionRenderer sectionType="internships" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />
      );
    case 'references':
      return (
        <SectionRenderer sectionType="references" data={ctx.data} templateKey={ctx.templateKey} color={ctx.color} />
      );
    default:
      return null;
  }
};

const renderRegion = (region: TemplateRegionDefinition, ctx: TemplateRenderContext) => {
  if (region.when && !region.when(ctx)) return null;

  return (
    <>
      {region.sections.map((section, idx) => (
        <React.Fragment key={`${section.type}-${idx}`}>{renderSection(section, ctx)}</React.Fragment>
      ))}
    </>
  );
};

type Regions = Partial<Record<'header' | 'sidebar' | 'main', TemplateRegionDefinition>>;

const renderWithLayout = (layout: TemplateLayoutDefinition, definitionRegions: Regions, ctx: TemplateRenderContext) => {
  if (layout.kind === 'one-column') {
    return (
      <div className={layout.rootClassName}>
        {definitionRegions.header && renderRegion(definitionRegions.header, ctx)}
        <div className={layout.mainClassName}>
          {definitionRegions.main && renderRegion(definitionRegions.main, ctx)}
        </div>
      </div>
    );
  }

  const hasSidebar = layout.hasSidebar(ctx);
  const sidebar = definitionRegions.sidebar ? renderRegion(definitionRegions.sidebar, ctx) : null;
  const main = definitionRegions.main ? renderRegion(definitionRegions.main, ctx) : null;

  return (
    <div className={layout.rootClassName}>
      {definitionRegions.header && renderRegion(definitionRegions.header, ctx)}
      <div className={layout.bodyClassName}>
        {layout.sidebarPosition !== 'right' && hasSidebar && sidebar}
        <div className={hasSidebar ? layout.mainClassName : layout.mainClassNameWithoutSidebar || layout.mainClassName}>
          {main}
        </div>
        {layout.sidebarPosition === 'right' && hasSidebar && sidebar}
      </div>
    </div>
  );
};

export const ConfigDrivenTemplate: React.FC<ConfigDrivenTemplateProps> = ({
  data = dummyResumeData,
  color,
  templateKey
}) => {
  const resolvedTemplateKey = templateKey || '';
  const definition = getTemplateDefinition(resolvedTemplateKey);
  if (!definition) return null;

  const ctx: TemplateRenderContext = {
    templateKey: definition.key,
    data,
    color
  };

  return renderWithLayout(definition.layout, definition.regions, ctx);
};

export default ConfigDrivenTemplate;
