import { ResumeUploadForm } from '@/app/components/resume-score/ResumeUploadForm';
import { PastAnalysisSidebar } from '@/app/components/resume-score/PastAnalysisSidebar';
import { getUserAnalysisHistory } from '@/app/lib/repositories/analysisHistoryRepo';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function ResumeAnalysisUploadPage() {
  // Fetch analysis history for the sidebar
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const analyses = await getUserAnalysisHistory(supabase, user.id, 10);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  1
                </div>
                <span className="ml-2 text-gray-900 font-medium">Upload Resume</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                  2
                </div>
                <span className="ml-2 text-gray-500">Results</span>
              </div>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <ResumeUploadForm />
            </div>

            {/* Sidebar - Takes up 1 column */}
            <div className="lg:col-span-1">
              <PastAnalysisSidebar analyses={analyses} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}