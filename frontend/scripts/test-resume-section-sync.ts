/**
 * Test script for resume section sync functionality
 * Tests syncing each form section to normalized database tables
 */

import { getSupabaseClient } from '@/integrations/supabase/client';
import { ResumeSectionRepository } from '@/lib/repositories/resumeSectionRepository';
import type { ResumeData } from '@/lib/types';

async function testResumeSectionSync() {
  const supabase = getSupabaseClient();
  const repository = new ResumeSectionRepository(supabase);

  // Test resume ID (use a real one from your database)
  const testResumeId = '173c71b8-73ad-4812-94d1-8254cd9b7b8c';

  console.log('🧪 Testing Resume Section Sync...\n');

  try {
    // Test 1: Sync Personal Details
    console.log('1. Testing Personal Details sync...');
    const personalDetails: ResumeData['personalDetails'] = {
      jobTitle: 'Software Engineer',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      cityState: 'San Francisco, CA',
      country: 'USA',
      photoUrl: 'https://example.com/photo.jpg',
    };
    await repository.syncPersonalDetails(testResumeId, personalDetails);
    console.log('✅ Personal Details synced successfully');

    // Test 2: Sync Professional Summary
    console.log('\n2. Testing Professional Summary sync...');
    await repository.syncProfessionalSummary(testResumeId, 'Experienced software engineer with 5+ years of experience.');
    console.log('✅ Professional Summary synced successfully');

    // Test 3: Sync Education
    console.log('\n3. Testing Education sync...');
    const education: ResumeData['education'] = [
      {
        id: 1,
        school: 'University of Example',
        degree: 'Bachelor of Science in Computer Science',
        startDate: '2015-09',
        endDate: '2019-05',
        location: 'Example City, USA',
        description: 'Graduated with honors',
      },
    ];
    await repository.syncEducation(testResumeId, education);
    console.log('✅ Education synced successfully');

    // Test 4: Sync Employment History
    console.log('\n4. Testing Employment History sync...');
    const employmentHistory: ResumeData['employmentHistory'] = [
      {
        id: 1,
        jobTitle: 'Senior Software Engineer',
        employer: 'Tech Company Inc',
        startDate: '2020-01',
        endDate: '2024-12',
        location: 'Remote',
        description: 'Led development of key features',
      },
    ];
    await repository.syncEmploymentHistory(testResumeId, employmentHistory);
    console.log('✅ Employment History synced successfully');

    // Test 5: Sync Skills
    console.log('\n5. Testing Skills sync...');
    const skills: ResumeData['skills'] = [
      { name: 'JavaScript', level: 90 },
      { name: 'TypeScript', level: 85 },
      { name: 'React', level: 95 },
    ];
    await repository.syncSkills(testResumeId, skills);
    console.log('✅ Skills synced successfully');

    // Test 6: Sync Languages
    console.log('\n6. Testing Languages sync...');
    const languages: ResumeData['languages'] = ['English (Native)', 'Spanish (Fluent)'];
    await repository.syncLanguages(testResumeId, languages);
    console.log('✅ Languages synced successfully');

    // Test 7: Sync References
    console.log('\n7. Testing References sync...');
    const references: ResumeData['references'] = {
      hideReferences: false,
      references: [
        {
          name: 'Jane Smith',
          company: 'Previous Employer',
          phone: '+1234567890',
          email: 'jane@example.com',
        },
      ],
    };
    await repository.syncReferences(testResumeId, references);
    console.log('✅ References synced successfully');

    // Test 8: Sync Courses
    console.log('\n8. Testing Courses sync...');
    const courses: ResumeData['courses'] = [
      {
        id: 1,
        course: 'Advanced React Patterns',
        institution: 'Online Course Platform',
        startDate: '2023-01',
        endDate: '2023-03',
      },
    ];
    await repository.syncCourses(testResumeId, courses);
    console.log('✅ Courses synced successfully');

    // Verify data was inserted correctly
    console.log('\n📊 Verifying data in database...');
    
    const { data: personalData } = await supabase
      .from('resume_personal_details')
      .select('*')
      .eq('resume_id', testResumeId)
      .single();
    
    console.log('Personal Details:', personalData?.first_name, personalData?.last_name);

    const { data: summaryData } = await supabase
      .from('resume_professional_summary')
      .select('*')
      .eq('resume_id', testResumeId)
      .single();
    
    console.log('Professional Summary:', summaryData?.summary?.substring(0, 50) + '...');

    const { data: educationData } = await supabase
      .from('resume_education')
      .select('*')
      .eq('resume_id', testResumeId);
    
    console.log(`Education entries: ${educationData?.length || 0}`);

    const { data: skillsData } = await supabase
      .from('resume_skills')
      .select('*')
      .eq('resume_id', testResumeId);
    
    console.log(`Skills entries: ${skillsData?.length || 0}`);

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testResumeSectionSync()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { testResumeSectionSync };

