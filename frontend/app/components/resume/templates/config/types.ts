import type { ResumeData } from '@/lib/types';

export type TemplateRegion = 'header' | 'sidebar' | 'main';

export type TemplateSectionType =
  | 'header'
  | 'sidebar'
  | 'container'
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'courses'
  | 'internships'
  | 'references';

export type TemplateSectionDefinition = {
  type: TemplateSectionType;
  when?: (ctx: TemplateRenderContext) => boolean;
  props?: Record<string, unknown>;
  children?: TemplateSectionDefinition[];
};

export type TemplateRegionDefinition = {
  when?: (ctx: TemplateRenderContext) => boolean;
  sections: TemplateSectionDefinition[];
};

export type TemplateLayoutDefinition =
  | {
      kind: 'one-column';
      rootClassName: string;
      mainClassName: string;
    }
  | {
      kind: 'two-column';
      rootClassName: string;
      bodyClassName: string;
      sidebarClassName: string;
      mainClassName: string;
      mainClassNameWithoutSidebar?: string;
      sidebarPosition?: 'left' | 'right';
      hasSidebar: (ctx: TemplateRenderContext) => boolean;
    };

export type TemplateRenderContext = {
  templateKey: string;
  data: ResumeData;
  color?: string;
};

export type TemplateDefinition = {
  key: string;
  layout: TemplateLayoutDefinition;
  regions: Partial<Record<TemplateRegion, TemplateRegionDefinition>>;
};
