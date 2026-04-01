import { SectionStyleConfig } from '@/components/resume/sections/BaseSection';

// Template style configurations
export const TEMPLATE_STYLE_CONFIGS: Record<string, Record<string, SectionStyleConfig>> = {
  artisan: {
    education: {
      titleStyle: 'bold-uppercase',
      layout: 'grid',
      spacing: 'compact'
    },
    experience: {
      titleStyle: 'bold-uppercase',
      layout: 'grid',
      spacing: 'normal'
    },
    skills: {
      titleStyle: 'bold-uppercase',
      layout: 'list',
      spacing: 'compact'
    },
    languages: {
      titleStyle: 'bold-uppercase',
      layout: 'list',
      spacing: 'compact'
    },
    references: {
      titleStyle: 'bold-uppercase',
      layout: 'grid',
      spacing: 'normal'
    }
  },
  modernist: {
    education: {
      titleStyle: 'colored-border',
      layout: 'grid',
      spacing: 'spacious'
    },
    experience: {
      titleStyle: 'colored-border',
      layout: 'list',
      spacing: 'spacious'
    },
    skills: {
      titleStyle: 'colored-border',
      layout: 'list',
      spacing: 'normal'
    },
    references: {
      titleStyle: 'colored-border',
      layout: 'grid',
      spacing: 'spacious'
    }
  },
  cool: {
    education: {
      titleStyle: 'minimal',
      layout: 'list',
      spacing: 'normal'
    },
    experience: {
      titleStyle: 'minimal',
      layout: 'list',
      spacing: 'normal'
    },
    skills: {
      titleStyle: 'minimal',
      layout: 'list',
      spacing: 'compact'
    },
    references: {
      titleStyle: 'minimal',
      layout: 'grid',
      spacing: 'normal'
    }
  },
  executive: {
    education: {
      titleStyle: 'boxed',
      layout: 'list',
      spacing: 'normal'
    },
    experience: {
      titleStyle: 'boxed',
      layout: 'list',
      spacing: 'normal'
    },
    skills: {
      titleStyle: 'boxed',
      layout: 'list',
      spacing: 'compact'
    },
    references: {
      titleStyle: 'boxed',
      layout: 'grid',
      spacing: 'normal'
    }
  },
  milan: {
    education: {
      titleStyle: 'colored-border',
      layout: 'list',
      spacing: 'normal'
    },
    experience: {
      titleStyle: 'colored-border',
      layout: 'list',
      spacing: 'normal'
    },
    skills: {
      titleStyle: 'colored-border',
      layout: 'list',
      spacing: 'compact'
    },
    references: {
      titleStyle: 'colored-border',
      layout: 'grid',
      spacing: 'normal'
    }
  },
  cascade: {
    education: {
      titleStyle: 'minimal',
      layout: 'list',
      spacing: 'normal'
    },
    experience: {
      titleStyle: 'minimal',
      layout: 'list',
      spacing: 'normal'
    },
    skills: {
      titleStyle: 'minimal',
      layout: 'list',
      spacing: 'compact'
    },
    references: {
      titleStyle: 'minimal',
      layout: 'grid',
      spacing: 'normal'
    }
  },
  'simple-white': {
    education: {
      titleStyle: 'bold-uppercase',
      layout: 'list',
      spacing: 'normal'
    },
    experience: {
      titleStyle: 'bold-uppercase',
      layout: 'list',
      spacing: 'normal'
    },
    skills: {
      titleStyle: 'bold-uppercase',
      layout: 'list',
      spacing: 'compact'
    },
    references: {
      titleStyle: 'bold-uppercase',
      layout: 'grid',
      spacing: 'normal'
    }
  }
};

// Get style configuration for a specific template and section
export const getTemplateStyleConfig = (templateKey: string, sectionType: string): SectionStyleConfig => {
  return TEMPLATE_STYLE_CONFIGS[templateKey]?.[sectionType] || {
    titleStyle: 'minimal',
    layout: 'list',
    spacing: 'normal'
  };
};