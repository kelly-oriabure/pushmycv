import { toCustomSections } from '@/lib/utils/resumeCustomSections';
import { initialResumeData } from '@/lib/types';

describe('toCustomSections', () => {
  test('maps employmentHistory to experience', () => {
    const resumeData = {
      ...initialResumeData,
      employmentHistory: [
        {
          jobTitle: 'Software Engineer',
          employer: 'Acme',
          startDate: '2020-01',
          endDate: '2021-12',
          location: 'Remote',
          description: 'Built features',
        },
      ],
    };

    const custom = toCustomSections(resumeData);
    expect(Array.isArray(custom.experience)).toBe(true);
    expect(custom.experience).toHaveLength(1);
    expect(custom.experience[0]).toEqual({
      jobTitle: 'Software Engineer',
      employer: 'Acme',
      startDate: '2020-01',
      endDate: '2021-12',
      location: 'Remote',
      description: 'Built features',
    });
    expect((custom as any).employmentHistory).toBeUndefined();
  });
});

