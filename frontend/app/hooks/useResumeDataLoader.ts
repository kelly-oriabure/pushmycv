import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useResumeStore } from '@/store/resumeStore';
import type { ResumeData, PersonalDetailsData } from '@/lib/types';

export const useResumeDataLoader = (resumeId: string | null, userId: string | null) => {
  const supabase = getSupabaseClient();
  const { updateResumeData, resetResumeData, setTemplateId } = useResumeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResumeData = async () => {
      setIsLoading(true);
      if (!resumeId || !userId || resumeId === 'temp-resume-id') {
        setIsLoading(false);
        return;
      }

      try {
        resetResumeData();

        // Load resume template id
        const { data: resume, error: resumeError } = await supabase
          .from('resumes')
          .select('template_id')
          .eq('id', resumeId)
          .maybeSingle();

        if (resumeError) {
          console.error('Error loading resume:', resumeError);
        } else if (resume?.template_id) {
          setTemplateId(resume.template_id);
        }

        const [
          personalDetailsRes,
          professionalSummaryRes,
          educationRes,
          employmentHistoryRes,
          skillsRes,
          languagesRes,
          referencesRes,
          referencesSettingsRes,
          coursesRes,
        ] = await Promise.all([
          supabase
            .from('resume_personal_details')
            .select('job_title, first_name, last_name, email, phone, address, city_state, country, photo_url')
            .eq('resume_id', resumeId)
            .maybeSingle(),
          supabase
            .from('resume_professional_summary')
            .select('summary')
            .eq('resume_id', resumeId)
            .maybeSingle(),
          supabase
            .from('resume_education')
            .select('school, degree, start_date, end_date, location, description, display_order')
            .eq('resume_id', resumeId)
            .order('display_order', { ascending: true }),
          supabase
            .from('resume_employment_history')
            .select('job_title, employer, start_date, end_date, location, description, display_order')
            .eq('resume_id', resumeId)
            .order('display_order', { ascending: true }),
          supabase
            .from('resume_skills')
            .select('name, level, display_order')
            .eq('resume_id', resumeId)
            .order('display_order', { ascending: true }),
          supabase
            .from('resume_languages')
            .select('name, display_order')
            .eq('resume_id', resumeId)
            .order('display_order', { ascending: true }),
          supabase
            .from('resume_references')
            .select('name, company, phone, email, display_order')
            .eq('resume_id', resumeId)
            .order('display_order', { ascending: true }),
          supabase
            .from('resume_references_settings')
            .select('hide_references')
            .eq('resume_id', resumeId)
            .maybeSingle(),
          supabase
            .from('resume_courses')
            .select('course, institution, start_date, end_date, display_order')
            .eq('resume_id', resumeId)
            .order('display_order', { ascending: true }),
        ]);

        if (personalDetailsRes.error) {
          console.error('Error loading personal details:', personalDetailsRes.error);
        } else if (personalDetailsRes.data) {
          const item = personalDetailsRes.data as any;
          const personalDetails: PersonalDetailsData = {
            jobTitle: item.job_title || '',
            firstName: item.first_name || '',
            lastName: item.last_name || '',
            email: item.email || '',
            phone: item.phone || '',
            address: item.address || '',
            cityState: item.city_state || '',
            country: item.country || '',
            photoUrl: item.photo_url || undefined,
          };
          updateResumeData('personalDetails', personalDetails);
        }

        if (professionalSummaryRes.error) {
          console.error('Error loading professional summary:', professionalSummaryRes.error);
        } else if (professionalSummaryRes.data?.summary != null) {
          updateResumeData('professionalSummary', professionalSummaryRes.data.summary || '');
        }

        if (educationRes.error) {
          console.error('Error loading education:', educationRes.error);
        } else if (educationRes.data && educationRes.data.length > 0) {
          const educationData = educationRes.data.map((entry: any, index: number) => ({
            id: index + 1,
            school: entry.school || '',
            degree: entry.degree || '',
            startDate: entry.start_date || '',
            endDate: entry.end_date || '',
            location: entry.location || '',
            description: entry.description || '',
          }));
          updateResumeData('education', educationData);
        }

        if (employmentHistoryRes.error) {
          console.error('Error loading employment history:', employmentHistoryRes.error);
        } else if (employmentHistoryRes.data && employmentHistoryRes.data.length > 0) {
          const experienceData = employmentHistoryRes.data.map((entry: any, index: number) => ({
            id: index + 1,
            jobTitle: entry.job_title || '',
            employer: entry.employer || '',
            startDate: entry.start_date || '',
            endDate: entry.end_date || '',
            location: entry.location || '',
            description: entry.description || '',
          }));
          updateResumeData('employmentHistory', experienceData);
        }

        if (skillsRes.error) {
          console.error('Error loading skills:', skillsRes.error);
        } else if (skillsRes.data && skillsRes.data.length > 0) {
          const skillsData = skillsRes.data.map((skill: any) => ({
            name: skill.name,
            level: typeof skill.level === 'string' ? parseInt(skill.level, 10) || 0 : skill.level || 0,
          }));
          updateResumeData('skills', skillsData);
        }

        if (languagesRes.error) {
          console.error('Error loading languages:', languagesRes.error);
        } else if (languagesRes.data && languagesRes.data.length > 0) {
          const languagesData = languagesRes.data.map((lang: any) => lang.name);
          updateResumeData('languages', languagesData);
        }

        if (referencesRes.error) {
          console.error('Error loading references:', referencesRes.error);
        } else if (referencesRes.data) {
          const referencesData = (referencesRes.data || []).map((ref: any) => ({
            name: ref.name,
            company: ref.company || '',
            phone: ref.phone || '',
            email: ref.email || '',
          }));

          let hideReferences = false;
          if (referencesSettingsRes.error) {
            console.error('Error loading references settings:', referencesSettingsRes.error);
          } else if (referencesSettingsRes.data?.hide_references != null) {
            hideReferences = Boolean(referencesSettingsRes.data.hide_references);
          }

          if (referencesData.length > 0 || hideReferences) {
            updateResumeData('references', {
              references: referencesData,
              hideReferences,
            });
          }
        }

        if (coursesRes.error) {
          console.error('Error loading courses:', coursesRes.error);
        } else if (coursesRes.data && coursesRes.data.length > 0) {
          const coursesData = coursesRes.data.map((course: any) => ({
            course: course.course,
            institution: course.institution || '',
            startDate: course.start_date || '',
            endDate: course.end_date || '',
          }));
          updateResumeData('courses', coursesData);
        }

      } catch (error) {
        console.error('Error loading resume data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResumeData();
  }, [resumeId, userId, updateResumeData, resetResumeData, setTemplateId]);
  
  return { isLoading };
};
