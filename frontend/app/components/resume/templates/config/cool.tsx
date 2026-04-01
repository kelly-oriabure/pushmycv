import type { TemplateDefinition, TemplateRenderContext } from './types';
import { hasContent } from '../cool/helpers';

const hasSidebar = (ctx: TemplateRenderContext) => {
  const p = ctx.data.personalDetails;
  return hasContent(p) || hasContent(ctx.data.skills) || hasContent(ctx.data.languages);
};

export const coolDefinition: TemplateDefinition = {
  key: 'cool',
  layout: {
    kind: 'two-column',
    rootClassName: 'flex font-sans text-gray-900 bg-white text-xs aspect-[1/1.414] w-full shadow-lg',
    bodyClassName: 'contents',
    sidebarClassName: '',
    mainClassName: 'flex-1 px-10 pt-10 pb-16 flex flex-col gap-8 overflow-y-auto hide-scrollbar',
    mainClassNameWithoutSidebar: 'flex-1 px-10 pt-10 pb-16 flex flex-col gap-8 overflow-y-auto hide-scrollbar',
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
        {
          type: 'container',
          props: { className: 'section' },
          children: [
            { type: 'profile', when: (ctx) => hasContent(ctx.data.professionalSummary) },
            { type: 'experience', when: (ctx) => hasContent(ctx.data.employmentHistory) },
            { type: 'education', when: (ctx) => hasContent(ctx.data.education) },
            { type: 'skills', when: (ctx) => hasContent(ctx.data.skills) },
            { type: 'courses', when: (ctx) => hasContent(ctx.data.courses) },
            { type: 'internships', when: (ctx) => hasContent(ctx.data.internships) },
            { type: 'languages', when: (ctx) => hasContent(ctx.data.languages) },
            {
              type: 'references',
              when: (ctx) => hasContent(ctx.data.references) && !ctx.data.references?.hideReferences
            }
          ]
        }
      ]
    }
  }
};

