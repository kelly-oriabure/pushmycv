import type { TemplateDefinition, TemplateRenderContext } from './types';

const hasSidebar = (_ctx: TemplateRenderContext) => true;

export const executiveDefinition: TemplateDefinition = {
  key: 'executive',
  layout: {
    kind: 'two-column',
    rootClassName: 'flex font-sans text-gray-800 bg-white text-xs overflow-visible print:w-full print:max-w-none',
    bodyClassName: 'contents',
    sidebarClassName: '',
    mainClassName: 'w-2/3 px-6 pt-6 pb-12 overflow-visible print:px-4 print:pt-4 print:pb-8',
    mainClassNameWithoutSidebar: 'w-2/3 px-6 pt-6 pb-12 overflow-visible print:px-4 print:pt-4 print:pb-8',
    sidebarPosition: 'left',
    hasSidebar
  },
  regions: {
    sidebar: {
      sections: [{ type: 'sidebar' }]
    },
    main: {
      sections: [
        { type: 'profile', when: (ctx) => Boolean(ctx.data.professionalSummary) },
        { type: 'experience', when: (ctx) => Array.isArray(ctx.data.employmentHistory) && ctx.data.employmentHistory.length > 0 },
        { type: 'courses', when: (ctx) => Array.isArray(ctx.data.courses) && ctx.data.courses.length > 0 },
        { type: 'education', when: (ctx) => Array.isArray(ctx.data.education) && ctx.data.education.length > 0 },
        {
          type: 'references',
          when: (ctx) => Boolean(ctx.data.references) && !ctx.data.references?.hideReferences
        }
      ]
    }
  }
};

