'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, FileText, Upload, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CoverLetterGeneratorPage() {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setResume(file);
        toast({
          title: 'Resume uploaded',
          description: `Successfully uploaded ${file.name}`,
        });
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
          variant: 'destructive',
        });
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleGenerate = async () => {
    if (!resume) {
      toast({
        title: 'Missing resume',
        description: 'Please upload your resume first',
        variant: 'destructive',
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: 'Missing job description',
        description: 'Please provide the job description',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock cover letter response
      setCoverLetter(`Dear Hiring Manager,

I am writing to express my strong interest in the position at your company. With my background in [relevant field] and experience in [key skills], I believe I would be a valuable addition to your team.

My resume highlights my ability to [key achievement] and my commitment to [relevant value]. I am particularly drawn to this opportunity because [reason related to company/role].

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.

Sincerely,
[Your Name]`);
      
      toast({
        title: 'Cover letter generated!',
        description: 'Your AI-powered cover letter has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate cover letter. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResume(null);
    setJobDescription('');
    setCoverLetter('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/80 to-orange-50/80">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              AI Cover Letter Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create compelling, personalized cover letters in seconds with the power of AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Create Your Cover Letter
              </CardTitle>
              <CardDescription>
                Upload your resume and paste the job description to generate a personalized cover letter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Resume <span className="text-red-500">*</span>
                </label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <input {...getInputProps()} />
                  {resume ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p className="font-medium text-gray-900">{resume.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="font-medium text-gray-900">
                        {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse (PDF only)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </div>

              {/* Generate Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 bg-primary hover:bg-primary/80"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span className="font-bold">Generate Cover Letter</span>
                    </>
                  )}
                </Button>
                
                {(resume || jobDescription || coverLetter) && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="px-4"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5" />
                Your Cover Letter
              </CardTitle>
              <CardDescription>
                {coverLetter ? 'Your generated cover letter' : 'Your cover letter will appear here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coverLetter ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-6 rounded-lg border">
                    {coverLetter}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button 
                      onClick={() => navigator.clipboard.writeText(coverLetter)}
                      variant="outline"
                      className="flex-1"
                    >
                      Copy to Clipboard
                    </Button>
                    <Button 
                      onClick={() => window.print()}
                      variant="outline"
                      className="flex-1"
                    >
                      Print
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No cover letter yet</h3>
                  <p className="text-gray-500 text-sm">
                    Upload your resume and paste a job description to generate your personalized cover letter
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}