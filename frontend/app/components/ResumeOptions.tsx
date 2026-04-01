'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { createResumeUpload } from '@/lib/repositories/resumeUploadsRepo';
import { startResumeAnalysis } from '@/lib/edge/resumeAnalysis';
import { RESUME_IDS } from '@/constants/resume';

const ResumeOptionsInner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'extracting' | 'finalizing' | 'redirecting' | 'complete'>('uploading');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const templateId = searchParams.get('templateId') || '';
  const templateName = searchParams.get('templateName') || '';
  const resumeId = searchParams.get('resumeId') || ''; // Get resumeId from URL parameters
  const color = searchParams.get('color') || '';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isDocx =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx');
      if (isPdf || isDocx) {
        setSelectedFile(file);
        setUploadProgress(0);
        setUploadStatus('uploading');
        toast({
          title: "File selected",
          description: `${file.name} is ready for upload.`
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or DOCX file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    try {
      // Create FormData for the API request
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 50); // First 50% for upload
          setUploadProgress(percentComplete);
        }
      });

      // Upload and get IDs with progress tracking
      const result = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              resolve(responseData);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `HTTP ${xhr.status}: ${xhr.statusText}`));
            } catch {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Request timeout'));

        xhr.timeout = 60000; // 60 second timeout
        xhr.open('POST', '/api/process-resume-upload');
        xhr.send(formData);
      });

      if (result.success) {
        setUploadProgress(50);
        setUploadStatus('extracting');

        if (result.isDuplicate) {
          setUploadStatus('finalizing');
          setUploadProgress(90);
          toast({
            title: "Duplicate resume detected",
            description: "We found an existing copy of this resume. Redirecting to resume builder..."
          });
          // For duplicates, redirect immediately
          const targetResumeId = resumeId || result.resumeId;
          setTimeout(() => {
            setUploadStatus('redirecting');
            setUploadProgress(100);
            router.push(`/resume/builder/${targetResumeId}?templateId=${templateId}`);
          }, 1000);
          return;
        } else if (result.isUpdate) {
          setUploadStatus('finalizing');
          setUploadProgress(90);
          toast({
            title: "Resume updated",
            description: "Your existing resume has been updated with new content."
          });
          // For updates, redirect immediately
          const targetResumeId = resumeId || result.resumeId;
          setTimeout(() => {
            setUploadStatus('redirecting');
            setUploadProgress(100);
            router.push(`/resume/builder/${targetResumeId}?templateId=${templateId}`);
          }, 1000);
          return;
        } else {
          // For new uploads, wait for extraction to complete
          const extractionComplete = result.resumeId ? await pollExtractionStatus(result.resumeId) : false;

          if (extractionComplete) {
            setUploadStatus('finalizing');
            setUploadProgress(90);
            toast({
              title: result.isUpdate ? "Resume updated" : "Extraction complete",
              description: result.isUpdate
                ? "Your resume has been updated with new data!"
                : "Your resume data has been extracted successfully!"
            });

            // Redirect to builder
            const targetResumeId = resumeId || result.resumeId;
            setTimeout(() => {
              setUploadStatus('redirecting');
              setUploadProgress(100);
              router.push(`/resume/builder/${targetResumeId}?templateId=${templateId}`);
            }, 1000);
          } else {
            setUploadStatus('finalizing');
            setUploadProgress(90);
            toast({
              title: "Extraction timeout",
              description: "Extraction is taking longer than expected. You can still proceed to the builder.",
              variant: "destructive"
            });
            // Redirect anyway after timeout
            const targetResumeId = resumeId || result.resumeId;
            setTimeout(() => {
              setUploadStatus('redirecting');
              setUploadProgress(100);
              router.push(`/resume/builder/${targetResumeId}?templateId=${templateId}`);
            }, 1000);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to process resume upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  async function pollExtractionStatus(resumeId: string): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds max

    while (attempts < maxAttempts) {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('resumes')
        .select('custom_sections')
        .eq('id', resumeId)
        .single()
        .overrideTypes<{ custom_sections: unknown | null }, { merge: false }>();

      if (data?.custom_sections) {
        return true;
      }

      setUploadProgress(50 + (attempts / maxAttempts) * 50);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    return false;
  }

  const handleStartFromScratch = () => {
    router.push(
      `/resume/builder/${RESUME_IDS.TEMP}?templateId=${templateId}&templateName=${encodeURIComponent(templateName)}${
        color ? `&color=${encodeURIComponent(color)}` : ''
      }`
    );
  };

  return (
    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Create Your Resume</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your existing resume or start from scratch with our professional templates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Upload Resume Card */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-300 bg-white shadow-sm hover:shadow-md">
            <CardContent className="p-6 md:p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h2>
              <p className="text-gray-600 mb-6">Upload your existing resume (PDF or DOCX)</p>

              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Choose File
                </label>

                {selectedFile && (
                  <div className="text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || !user}
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!selectedFile || isUploading || !user ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadStatus === 'uploading' && `Uploading... ${uploadProgress}%`}
                      {uploadStatus === 'extracting' && `Extracting data... ${uploadProgress}%`}
                      {uploadStatus === 'finalizing' && `Finalizing... ${uploadProgress}%`}
                      {uploadStatus === 'redirecting' && `Redirecting... ${uploadProgress}%`}
                      {uploadStatus === 'complete' && 'Complete!'}
                    </>
                  ) : (
                    'Upload and Process Resume'
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Start from Scratch Card */}
          <Card className="border-2 border-gray-200 hover:border-green-500 transition-colors duration-300 bg-white shadow-sm hover:shadow-md cursor-pointer" onClick={handleStartFromScratch}>
            <CardContent className="p-6 md:p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">Start from Scratch</h2>
              <p className="text-gray-600 mb-6">Create resume with our professional templates</p>

              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Create New Resume
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ResumeOptionsPage = () => (
  <Suspense fallback={<div className="p-6">Loading options...</div>}>
    <ResumeOptionsInner />
  </Suspense>
);

export default ResumeOptionsPage;
