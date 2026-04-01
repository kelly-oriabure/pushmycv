'use client';
import { useState } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Education hooks
export const useEducationData = (resumeId: string) => {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEducation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_education')
        .select('*')
        .eq('resume_id', resumeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createEducation = async (data: TablesInsert<'resume_education'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_education')
        .insert({
          ...data,
          resume_id: resumeId,
          school: data.school ?? '',
          degree: data.degree ?? '',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEducation = async (id: string, data: TablesUpdate<'resume_education'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_education')
        .update({
          ...data,
          school: data.school ?? '',
          degree: data.degree ?? '',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteEducation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_education')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchEducation,
    createEducation,
    updateEducation,
    deleteEducation,
  };
};

// Experience hooks
export const useExperienceData = (resumeId: string) => {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExperience = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_employment_history')
        .select('*')
        .eq('resume_id', resumeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createExperience = async (data: TablesInsert<'resume_employment_history'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_employment_history')
        .insert({
          ...data,
          resume_id: resumeId,
          job_title: data.job_title ?? '',
          employer: data.employer ?? '',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateExperience = async (id: string, data: TablesUpdate<'resume_employment_history'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_employment_history')
        .update({
          ...data,
          job_title: data.job_title ?? '',
          employer: data.employer ?? '',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteExperience = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_employment_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchExperience,
    createExperience,
    updateExperience,
    deleteExperience,
  };
};

// Skills hooks
export const useSkillsData = (resumeId: string) => {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_skills')
        .select('*')
        .eq('resume_id', resumeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createSkill = async (data: TablesInsert<'resume_skills'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_skills')
        .insert({
          ...data,
          resume_id: resumeId,
          name: data.name ?? '',
          level: data.level ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSkill = async (id: string, data: TablesUpdate<'resume_skills'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_skills')
        .update({
          ...data,
          name: data.name ?? '',
          level: data.level ?? 0,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchSkills,
    createSkill,
    updateSkill,
    deleteSkill,
  };
};

// Languages hooks
export const useLanguagesData = (resumeId: string) => {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_languages')
        .select('*')
        .eq('resume_id', resumeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createLanguage = async (data: TablesInsert<'resume_languages'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_languages')
        .insert({ ...data, resume_id: resumeId, name: data.name ?? '' })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLanguage = async (id: string, data: TablesUpdate<'resume_languages'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_languages')
        .update({ ...data, name: data.name ?? '' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteLanguage = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchLanguages,
    createLanguage,
    updateLanguage,
    deleteLanguage,
  };
};

// References hooks
export const useReferencesData = (resumeId: string) => {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_references')
        .select('*')
        .eq('resume_id', resumeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createReference = async (data: TablesInsert<'resume_references'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_references')
        .insert({ ...data, resume_id: resumeId, name: data.name ?? '' })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateReference = async (id: string, data: TablesUpdate<'resume_references'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_references')
        .update({ ...data, name: data.name ?? '' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteReference = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_references')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getHideReferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_references_settings')
        .select('hide_references')
        .eq('resume_id', resumeId)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data?.hide_references);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setHideReferences = async (hide: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_references_settings')
        .upsert({ resume_id: resumeId, hide_references: hide }, { onConflict: 'resume_id' });

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchReferences,
    createReference,
    updateReference,
    deleteReference,
    getHideReferences,
    setHideReferences,
  };
};

// Courses hooks
export const useCoursesData = (resumeId: string) => {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resume_courses')
        .select('*')
        .eq('resume_id', resumeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (data: TablesInsert<'resume_courses'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_courses')
        .insert({
          ...data,
          resume_id: resumeId,
          course: data.course ?? '',
          institution: data.institution ?? '',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (id: string, data: TablesUpdate<'resume_courses'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('resume_courses')
        .update({
          ...data,
          course: data.course ?? '',
          institution: data.institution ?? '',
          start_date: data.start_date ?? '',
          end_date: data.end_date ?? '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('resume_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};

// Internships hooks
export const useInternshipsData = (resumeId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createInternship = async (_data: unknown) => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInternship = async (_id: string, _data: unknown) => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInternship = async (_id: string) => {
    setLoading(true);
    setError(null);
    try {
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchInternships,
    createInternship,
    updateInternship,
    deleteInternship,
  };
};
