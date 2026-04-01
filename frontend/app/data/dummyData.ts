import type { ResumeData } from '@/lib/types';

export const dummyResumeData: ResumeData = {
  personalDetails: {
    jobTitle: 'Senior Software Engineer',
    firstName: 'Chinedu',
    lastName: 'Okafor',
    email: 'chinedu.okafor@example.com',
    phone: '+234 803 123 4567',
    address: '15 Allen Avenue',
    cityState: 'Ikeja, Lagos',
    country: 'Nigeria',
    photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  professionalSummary:
    'Results-driven Senior Software Engineer with over 8 years of experience in designing, developing, and deploying scalable web applications. Proficient in JavaScript, React, Node.js, and cloud technologies. Proven ability to lead projects, mentor junior developers, and collaborate effectively with cross-functional teams to deliver high-quality software solutions in the Nigerian tech ecosystem.',
  education: [
    {
      id: 1,
      school: 'University of Lagos',
      degree: 'Master of Science in Computer Science',
      startDate: '2014-09',
      endDate: '2016-05',
      location: 'Lagos, Lagos',
      description: 'Focused on advanced algorithms, distributed systems, and machine learning. Thesis on scalable data processing pipelines for African fintech solutions.',
    },
    {
      id: 2,
      school: 'Obafemi Awolowo University',
      degree: 'Bachelor of Science in Software Engineering',
      startDate: '2010-09',
      endDate: '2014-05',
      location: 'Ile-Ife',
      description: 'Graduated with honors. Active member of the coding club and participated in several hackathons including the annual Lagos Tech Summit.',
    },
  ],
  employmentHistory: [
    {
      id: 1,
      jobTitle: 'Senior Software Engineer',
      employer: 'Flutterwave',
      startDate: '2018-06',
      endDate: 'Present',
      location: 'Lagos',
      description:
        '- Led the development of payment integration solutions for over 1000+ African businesses, improving transaction success rates by 35%.\n- Mentored a team of 5 junior engineers, providing guidance on best practices and code quality in a fast-paced fintech environment.\n- Optimized application performance, reducing API response times by 40% through database query optimization and caching strategies.',
    },
    {
      id: 2,
      jobTitle: 'Software Engineer',
      employer: 'Andela',
      startDate: '2016-06',
      endDate: '2018-05',
      location: 'Lagos',
      description:
        '- Developed and maintained features for a talent matching platform connecting African developers with global opportunities.\n- Collaborated with UX/UI designers to implement responsive and user-friendly interfaces for both web and mobile applications.\n- Wrote comprehensive unit and integration tests, increasing code coverage by 30% and reducing production bugs.',
    },
  ],
  skills: [
    { name: 'JavaScript', level: 95 },
    { name: 'React', level: 90 },
    { name: 'Node.js', level: 85 },
    { name: 'TypeScript', level: 80 },
    { name: 'SQL', level: 75 },
    { name: 'AWS', level: 70 },
  ],
  languages: ['English (Native)', 'Yoruba (Fluent)', 'Igbo (Basic)'],
  references: {
    references: [
      {
        name: 'Adunni Adeboye',
        company: 'Flutterwave',
        phone: '+234 802 987 6543',
        email: 'adunni.adeboye@flutterwave.com',
      },
    ],
    hideReferences: false,
  },
  courses: [
    {
      course: 'Advanced React Patterns',
      institution: 'Online University',
      startDate: '2021-03',
      endDate: '2021-04',
    },
    {
      course: 'Node.js Masterclass',
      institution: 'Code Academy',
      startDate: '2020-07',
      endDate: '2020-09',
    },
    {
      course: 'Cloud Infrastructure with AWS',
      institution: 'Cloud Guru',
      startDate: '2019-01',
      endDate: '2019-03',
    },
  ],
  internships: [
    {
      jobTitle: 'Software Development Intern',
      employer: 'Tech4Dev',
      startDate: '2013-06',
      endDate: '2013-08',
      location: 'Lagos, Nigeria',
    },
  ],
};
