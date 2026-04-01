import type { TemplateDefinition, TemplateRenderContext } from './types';
import { hasContent } from '../cascade/helpers';

const hasSidebar = (ctx: TemplateRenderContext) => {
  const p = ctx.data.personalDetails;
  const hasContact =
    hasContent(p?.phone) || hasContent(p?.email) || hasContent(p?.address) || hasContent(p?.cityState);
  return hasContent(p) || hasContact || hasContent(ctx.data.skills) || hasContent(ctx.data.languages);
};

export const cascadeDefinition: TemplateDefinition = {
  key: 'cascade',
  layout: {
    kind: 'two-column',
    rootClassName: 'flex font-sans bg-white text-sm text-gray-700 aspect-[1/1.414] w-full',
    bodyClassName: 'contents',
    sidebarClassName: '',
    mainClassName: 'w-[62%] p-8 overflow-y-auto hide-scrollbar',
    mainClassNameWithoutSidebar: 'w-full p-8 overflow-y-auto hide-scrollbar',
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
        { type: 'profile', when: (ctx) => hasContent(ctx.data.professionalSummary) && !hasSidebar(ctx) },
        { type: 'experience', when: (ctx) => hasContent(ctx.data.employmentHistory) },
        { type: 'education', when: (ctx) => hasContent(ctx.data.education) },
        { type: 'skills', when: (ctx) => hasContent(ctx.data.skills) && !hasSidebar(ctx) },
        { type: 'courses', when: (ctx) => hasContent(ctx.data.courses) },
        { type: 'languages', when: (ctx) => hasContent(ctx.data.languages) && !hasSidebar(ctx) },
        {
          type: 'references',
          when: (ctx) => hasContent(ctx.data.references) && !ctx.data.references?.hideReferences
        }
      ]
    }
  }
};

