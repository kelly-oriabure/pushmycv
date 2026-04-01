import { notFound, redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { ScoreDashboard } from '../../components/resume-score/ScoreDashboard';
import { PastAnalysisSidebar, PastAnalysisItem } from '../../components/resume-score/PastAnalysisSidebar';
import { getUserAnalysisHistory } from '../../lib/repositories/analysisHistoryRepo';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText } from 'lucide-react';

interface CategoryResult {
  category: string;
  score: number;
  type?: string;
  tips?: string[];
  explanation?: string;
  category_key?: string;
  tips_type?: string;
}

interface WorkflowResponse {
  overall_score?: number;
  skills_match?: number;
  experience?: number;
  formatting?: number;
  keywords?: number;
  analysis_summary?: string;
  recommendations?: string[];
  error?: string;
  categories?: CategoryResult[];
}

interface AnalysisData {
  id: string;
  user_id: string;
  upload_id: string;
  job_title: string;
  overall_score: number;
  score_breakdown: any;
  suggestions: string[];
  ats_score: number;
  status: string;
  error_message: string | null;
  file_url: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  content_score: number | null;
  structure_score: number | null;
  skills_score: number | null;
  email_score: number | null;
  length_score: number | null;
  brevity_score: number | null;
  ats_type: string | null;
  content_type: string | null;
  structure_type: string | null;
  skills_type: string | null;
  email_type: string | null;
  length_type: string | null;
  brevity_type: string | null;
  ats_tips_explanation: string | null;
  content_tips_explanation: string | null;
  structure_tips_explanation: string | null;
  skills_tips_explanation: string | null;
  email_tips_explanation: string | null;
  length_tips_explanation: string | null;
  brevity_tips_explanation: string | null;
  ats_tips_tip: string | null;
  content_tips_tip: string | null;
  structure_tips_tip: string | null;
  skills_tips_tip: string | null;
  email_tips_tip: string | null;
  length_tips_tip: string | null;
  brevity_tips_tip: string | null;
}

// Server function to fetch real data from Supabase
async function getResumeAnalysisData(id: string): Promise<{
  uploadData: any;
  analysisData: AnalysisData | null;
  transformedResults: WorkflowResponse;
}> {
  const supabase = await getSupabaseServerClient();

  console.log('Fetching resume analysis data for ID:', id);

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      redirect('/auth/login');
    }

    // Fetch upload data with validation
    const { data: uploadData, error: uploadError } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !uploadData) {
      console.warn('Upload not found or access denied:', id);
      // Redirect to upload page instead of showing error
      redirect('/resume-analysis-upload?error=upload_not_found');
    }

    // Fetch analysis data
    const { data: analysisData, error: analysisError } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('upload_id', id)
      .eq('user_id', user.id)
      .single();

    // Add URL cleanup for stale IDs
    if (analysisError?.code === 'PGRST116') {
      console.warn('Analysis not found for upload:', id);
      // Don't redirect, show processing state instead
    }

    // Return appropriate response based on data availability
    if (!analysisData) {
      console.log('No analysis data found, returning processing state');
      return {
        uploadData,
        analysisData: null,
        transformedResults: {
          overall_score: 0,
          analysis_summary: 'Analysis pending',
          recommendations: ['Your resume is being analyzed. Please check back shortly.'],
          categories: []
        }
      };
    }

    // Helper function to safely access dynamic properties
    function getAnalysisProperty(data: AnalysisData, key: string, suffix: string): string | undefined {
      const propName = `${key}${suffix}` as keyof AnalysisData;
      const value = data[propName];
      return value === null ? undefined : (value as string | undefined);
    }

    // Transform analysis data to WorkflowResponse format
    let transformedResults: WorkflowResponse = {};

    if (analysisData && analysisData.status === 'completed') {
      // Build categories array for ScoreDashboard from real data
      const categories: CategoryResult[] = [];

      // Extract score_breakdown for explanations
      const scoreBreakdown = analysisData.score_breakdown || {};

      // Map individual score columns to categories
      const scoreMappings = [
        { key: 'ats', label: 'ATS Compatibility', score: analysisData.ats_score },
        { key: 'content', label: 'Content Quality', score: analysisData.content_score },
        { key: 'structure', label: 'Structure & Formatting', score: analysisData.structure_score },
        { key: 'skills', label: 'Skills Match', score: analysisData.skills_score },
        { key: 'email', label: 'Email & Contact', score: analysisData.email_score },
        { key: 'length', label: 'Resume Length', score: analysisData.length_score },
        { key: 'brevity', label: 'Brevity & Conciseness', score: analysisData.brevity_score }
      ];

      // Process each score mapping with correct explanation field mapping from score_breakdown
      scoreMappings.forEach(mapping => {
        if (mapping.score !== null && mapping.score !== undefined) {
          // Get explanation from score_breakdown (where it's actually stored)
          const explanation = scoreBreakdown[`${mapping.key}_analysis`]
            || scoreBreakdown[`${mapping.key}_explanation`]
            || '';

          // Get tips from score_breakdown
          const tipsValue = scoreBreakdown[`${mapping.key}_tips`]
            || scoreBreakdown.priority_improvements;
          const tips = tipsValue ? (Array.isArray(tipsValue) ? tipsValue : [tipsValue]) : undefined;

          const category: CategoryResult = {
            category: mapping.label,
            score: Math.max(0, Math.min(100, Math.round(mapping.score))),
            category_key: mapping.key,
            explanation: explanation || undefined,
            tips: tips
          };
          categories.push(category);
        }
      });

      // Also check score_breakdown for any additional categories
      const breakdown = analysisData.score_breakdown || {};
      Object.entries(breakdown).forEach(([key, value]) => {
        const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
        if (!Number.isNaN(n) && !categories.find(c => c.category_key === key)) {
          categories.push({
            category: key.charAt(0).toUpperCase() + key.slice(1),
            score: Math.max(0, Math.min(100, Math.round(n))),
            category_key: key
          });
        }
      });

      transformedResults = {
        overall_score: analysisData.overall_score ?? 0,
        skills_match: analysisData.skills_score ?? undefined,
        experience: analysisData.content_score ?? undefined,
        formatting: analysisData.structure_score ?? undefined,
        keywords: analysisData.ats_score ?? undefined,
        analysis_summary: undefined,
        recommendations: Array.isArray(analysisData.suggestions) ? analysisData.suggestions : undefined,
        categories,
      };
    } else if (analysisData && analysisData.status === 'processing') {
      // Analysis is complete but status hasn't been updated
      // Use the same transformation logic
      const categories: CategoryResult[] = [];

      // Extract score_breakdown for explanations
      const scoreBreakdown = analysisData.score_breakdown || {};

      const scoreMappings = [
        { key: 'ats', label: 'ATS Compatibility', score: analysisData.ats_score },
        { key: 'content', label: 'Content Quality', score: analysisData.content_score },
        { key: 'structure', label: 'Structure & Formatting', score: analysisData.structure_score },
        { key: 'skills', label: 'Skills Match', score: analysisData.skills_score },
        { key: 'email', label: 'Email & Contact', score: analysisData.email_score },
        { key: 'length', label: 'Resume Length', score: analysisData.length_score },
        { key: 'brevity', label: 'Brevity & Conciseness', score: analysisData.brevity_score }
      ];

      scoreMappings.forEach(mapping => {
        if (mapping.score !== null && mapping.score !== undefined) {
          // Get explanation from score_breakdown (where it's actually stored)
          const explanation = scoreBreakdown[`${mapping.key}_analysis`]
            || scoreBreakdown[`${mapping.key}_explanation`]
            || '';

          // Get tips from score_breakdown
          const tipsValue = scoreBreakdown[`${mapping.key}_tips`]
            || scoreBreakdown.priority_improvements;
          const tips = tipsValue ? (Array.isArray(tipsValue) ? tipsValue : [tipsValue]) : undefined;

          const category: CategoryResult = {
            category: mapping.label,
            score: Math.max(0, Math.min(100, Math.round(mapping.score))),
            category_key: mapping.key,
            explanation: explanation || undefined,
            tips: tips
          };
          categories.push(category);
        }
      });

      transformedResults = {
        overall_score: analysisData.overall_score ?? 0,
        skills_match: analysisData.skills_score ?? undefined,
        experience: analysisData.content_score ?? undefined,
        formatting: analysisData.structure_score ?? undefined,
        keywords: analysisData.ats_score ?? undefined,
        analysis_summary: undefined,
        recommendations: Array.isArray(analysisData.suggestions) ? analysisData.suggestions : undefined,
        categories,
      };
    } else {
      // No analysis data or still processing
      transformedResults = {
        overall_score: 0,
        error: analysisData?.error_message || 'Analysis in progress. Please check back shortly.'
      };
    }

    return {
      uploadData,
      analysisData,
      transformedResults,
    };

  } catch (error) {
    console.error('Database error:', error);
    // Redirect to upload page on critical errors
    redirect('/resume-analysis-upload?error=database_error');
  }
}

interface ResumeScorePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResumeScorePage({ searchParams }: ResumeScorePageProps) {
  const params = await searchParams;
  const getParam = (val: string | string[] | undefined) => Array.isArray(val) ? val[0] : val;
  const uploadId = (getParam(params.id) as string) || (getParam(params.uploadId) as string);

  // Require uploadId for normal operation
  if (!uploadId) {
    redirect('/resume-analysis-upload');
  }

  // Fetch real data from database
  const { uploadData, analysisData, transformedResults } = await getResumeAnalysisData(uploadId);

  // Fetch user's analysis history for sidebar
  let history: PastAnalysisItem[] = [];
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      history = await getUserAnalysisHistory(supabase, user.id, 10);
    }
  } catch (err) {
    console.error('Failed to fetch analysis history:', err);
    // Continue without sidebar data
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                ✓
              </div>
              <span className="ml-2 text-green-600 font-medium">Upload Resume</span>
            </div>
            <div className="w-12 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                2
              </div>
              <span className="ml-2 text-gray-900 font-medium">Results</span>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Past Analyses */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="sticky top-4">
                <PastAnalysisSidebar analyses={history} />
              </div>
            </div>

            {/* Score Dashboard */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <ScoreDashboard
                analysisResults={transformedResults}
                isInitialLoading={false}
                uploadId={uploadId}
                fileName={uploadData?.file_name}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}