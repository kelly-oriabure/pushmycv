import type { TemplateDefinition } from './types';
import { hasContent } from '../modernist/helpers';

export const modernistDefinition: TemplateDefinition = {
  key: 'modernist',
  layout: {
    kind: 'one-column',
    rootClassName: 'bg-white p-10 font-sans text-gray-800 text-sm leading-relaxed w-full print:w-full print:max-w-none',
    mainClassName: 'pt-6 hide-scrollbar'
  },
  regions: {
    header: {
      when: (ctx) => hasContent(ctx.data.personalDetails),
      sections: [
        {
          type: 'container',
          props: { className: 'print:w-full print:mx-0 print:px-0' },
          children: [{ type: 'header' }]
        }
      ]
    },
    main: {
      sections: [
        {
          type: 'container',
          props: { className: 'space-y-6 mt-6' },
          children: [
            { type: 'profile', when: (ctx) => hasContent(ctx.data.professionalSummary) },
            { type: 'experience', when: (ctx) => hasContent(ctx.data.employmentHistory) },
            { type: 'education', when: (ctx) => hasContent(ctx.data.education) },
            { type: 'skills', when: (ctx) => hasContent(ctx.data.skills) },
            { type: 'courses', when: (ctx) => hasContent(ctx.data.courses) },
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

