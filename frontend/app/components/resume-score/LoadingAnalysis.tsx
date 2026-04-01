'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import type { LoadingAnalysisProps, ResumeAnalysis } from '@/types/resume-score';

export function LoadingAnalysis({ analysisId, onComplete }: LoadingAnalysisProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const { toast } = useToast();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef<NodeJS.Timeout | null>(null);
  
  const estimatedTime = 120; // 2 minutes estimated time
  
  const fetchAnalysisStatus = useCallback(async () => {
    if (cancelled) return;
    
    try {
      const response = await fetch(`/api/resume-score/status/${analysisId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analysis status');
      }
      
      setAnalysis(data);
      
      if (data.status === 'completed') {
        setProgress(100);
        clearIntervals();
        setTimeout(() => {
          if (!cancelled) {
            onComplete();
          }
        }, 1000);
      } else if (data.status === 'failed') {
        setError(data.error_message || 'Analysis failed');
        clearIntervals();
      }
    } catch (err) {
      console.error('Status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check status');
      clearIntervals();
    }
  }, [analysisId, cancelled, onComplete]);
  
  const clearIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = null;
    }
  };
  
  const handleCancel = () => {
    setCancelled(true);
    clearIntervals();
    toast({
      title: "Analysis cancelled",
      description: "You can upload a new resume anytime.",
    });
    // Go back to upload state
    window.location.reload();
  };
  
  useEffect(() => {
    if (cancelled) return;
    
    // Initial fetch
    fetchAnalysisStatus();
    
    // Poll every 5 seconds
    intervalRef.current = setInterval(fetchAnalysisStatus, 5000);
    
    // Update time elapsed every second
    timeRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        // Update progress based on time elapsed (with some randomness for realism)
        if (newTime <= estimatedTime) {
          const baseProgress = (newTime / estimatedTime) * 85; // Max 85% based on time
          const randomFactor = Math.random() * 10; // Add some randomness
          setProgress(Math.min(baseProgress + randomFactor, 90)); // Cap at 90% until completion
        }
        return newTime;
      });
    }, 1000);
    
    return () => {
      clearIntervals();
    };
  }, [analysisId, cancelled, fetchAnalysisStatus]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getEstimatedTimeRemaining = () => {
    const remaining = Math.max(0, estimatedTime - timeElapsed);
    return formatTime(remaining);
  };
  
  if (cancelled) {
    return null;
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white border-gray-200">
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Failed</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (analysis?.status === 'completed') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white border-gray-200">
          <CardContent className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Complete!</h3>
            <p className="text-gray-600 mb-6">Your resume has been successfully analyzed.</p>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white border-gray-200">
        <CardContent className="py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <FileText className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Analyzing Your Resume</h3>
            <p className="text-gray-600">
              Our AI is carefully reviewing your resume against industry standards
            </p>
          </div>
          
          {/* Progress */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-900 font-medium">Analysis Progress</span>
                <span className="text-blue-600 font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            
            {/* Time Information */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <Clock className="mx-auto h-5 w-5 text-gray-600 mb-2" />
                <div className="text-gray-900 font-semibold">{formatTime(timeElapsed)}</div>
                <div className="text-gray-600 text-sm">Time Elapsed</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Clock className="mx-auto h-5 w-5 text-gray-600 mb-2" />
                <div className="text-gray-900 font-semibold">{getEstimatedTimeRemaining()}</div>
                <div className="text-gray-600 text-sm">Est. Remaining</div>
              </div>
            </div>
            
            {/* Analysis Steps */}
            <div className="space-y-3">
              <div className="text-gray-900 font-medium mb-3">Analysis Steps:</div>
              
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">Document uploaded and processed</span>
              </div>
              
              <div className="flex items-center space-x-3">
                {progress > 20 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 animate-pulse"></div>
                )}
                <span className={progress > 20 ? 'text-gray-700' : 'text-gray-500'}>
                  Extracting text and content
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {progress > 50 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 animate-pulse"></div>
                )}
                <span className={progress > 50 ? 'text-gray-700' : 'text-gray-500'}>
                  Analyzing against job requirements
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {progress > 80 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 animate-pulse"></div>
                )}
                <span className={progress > 80 ? 'text-gray-700' : 'text-gray-500'}>
                  Generating improvement suggestions
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {progress >= 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 animate-pulse"></div>
                )}
                <span className={progress >= 100 ? 'text-gray-700' : 'text-gray-500'}>
                  Finalizing your score report
                </span>
              </div>
            </div>
            
            {/* File Info */}
            {analysis && (
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{analysis.file_name}</span>
                  </div>
                  <div className="text-gray-600">
                    {analysis.job_title}
                  </div>
                </div>
              </div>
            )}
            
            {/* Cancel Button */}
            <div className="text-center pt-4">
              <Button 
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300 text-gray-900 hover:bg-gray-100"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}