import React from 'react';
import type { TemplateDefinition, TemplateRenderContext } from './types';
import { hasContent } from '../simple-white/helpers';

const hasSidebar = (ctx: TemplateRenderContext) => {
  const personalDetails = ctx.data.personalDetails;
  const contactInfo = {
    address: personalDetails?.address,
    cityState: personalDetails?.cityState,
    country: personalDetails?.country
  };

  return hasContent(contactInfo) || hasContent(ctx.data.skills) || hasContent(ctx.data.languages);
};

export const simpleWhiteDefinition: TemplateDefinition = {
  key: 'simple-white',
  layout: {
    kind: 'two-column',
    rootClassName:
      'bg-white p-10 font-sans text-gray-800 text-[10px] leading-relaxed aspect-[1/1.414] w-full flex flex-col',
    bodyClassName: 'flex mt-8 flex-grow min-h-0',
    sidebarClassName: '',
    mainClassName: 'w-2/3 pl-12 overflow-y-auto hide-scrollbar min-h-0',
    mainClassNameWithoutSidebar: 'w-full overflow-y-auto hide-scrollbar min-h-0',
    sidebarPosition: 'left',
    hasSidebar
  },
  regions: {
    header: {
      when: (ctx) => hasContent(ctx.data.personalDetails),
      sections: [{ type: 'header' }]
    },
    sidebar: {
      when: (ctx) => hasSidebar(ctx),
      sections: [{ type: 'sidebar' }]
    },
    main: {
      sections: [
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
  }
};
