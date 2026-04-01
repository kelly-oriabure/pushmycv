import type { TemplateDefinition, TemplateRenderContext } from './types';
import { hasContent } from '../artisan/helpers';

const hasReferences = (ctx: TemplateRenderContext) => {
  const items = ctx.data.references?.references;
  return Array.isArray(items) && items.length > 0;
};

export const artisanDefinition: TemplateDefinition = {
  key: 'artisan',
  layout: {
    kind: 'one-column',
    rootClassName: 'bg-white font-sans text-gray-800 text-sm leading-relaxed aspect-[1/1.414] w-full flex flex-col',
    mainClassName: 'p-10 flex-grow overflow-y-auto hide-scrollbar'
  },
  regions: {
    header: {
      when: (ctx) => hasContent(ctx.data.personalDetails),
      sections: [{ type: 'header' }]
    },
    main: {
      sections: [
        { type: 'profile', when: (ctx) => hasContent(ctx.data.professionalSummary) },
        { type: 'experience', when: (ctx) => hasContent(ctx.data.employmentHistory) },
        {
          type: 'container',
          when: (ctx) => hasContent(ctx.data.education),
          props: { className: 'mb-6' },
          children: [{ type: 'education' }]
        },
        {
          type: 'container',
          when: (ctx) => hasContent(ctx.data.skills) || hasContent(ctx.data.languages),
          props: { className: 'grid grid-cols-2 gap-10' },
          children: [
            { type: 'skills', when: (ctx) => hasContent(ctx.data.skills) },
            { type: 'languages', when: (ctx) => hasContent(ctx.data.languages) }
          ]
        },
        {
          type: 'container',
          props: { className: 'grid grid-cols-2 gap-10 mt-6' },
          children: [
            { type: 'courses', when: (ctx) => hasContent(ctx.data.courses) },
            { type: 'references', when: hasReferences }
          ]
        }
      ]
    }
  }
};

