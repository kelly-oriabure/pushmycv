import type { TemplateDefinition, TemplateRenderContext } from './types';
import { hasContent } from '../milan/helpers';

const hasSidebar = (ctx: TemplateRenderContext) => {
  return hasContent(ctx.data.personalDetails) || hasContent(ctx.data.skills) || hasContent(ctx.data.languages);
};

export const milanDefinition: TemplateDefinition = {
  key: 'milan',
  layout: {
    kind: 'two-column',
    rootClassName: 'flex font-sans text-gray-800 bg-white text-sm leading-relaxed aspect-[1/1.414] w-full',
    bodyClassName: 'contents',
    sidebarClassName: '',
    mainClassName: 'w-full p-10 overflow-y-auto hide-scrollbar',
    mainClassNameWithoutSidebar: 'w-full p-10 overflow-y-auto hide-scrollbar',
    sidebarPosition: 'left',
    hasSidebar
  },
  regions: {
    sidebar: {
      when: hasSidebar,
      sections: [{ type: 'sidebar' }]
    },
    main: {
      sections: [
        { type: 'profile', when: (ctx) => hasContent(ctx.data.professionalSummary) },
        { type: 'experience', when: (ctx) => hasContent(ctx.data.employmentHistory) },
        { type: 'courses', when: (ctx) => hasContent(ctx.data.courses) },
        { type: 'education', when: (ctx) => hasContent(ctx.data.education) },
        {
          type: 'references',
          when: (ctx) => hasContent(ctx.data.references) && !ctx.data.references?.hideReferences
        }
      ]
    }
  }
};

