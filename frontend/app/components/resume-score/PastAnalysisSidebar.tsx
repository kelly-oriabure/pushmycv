'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, TrendingUp, AlertCircle, Clock, ChevronRight, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface PastAnalysisItem {
  analysis_id: string;
  upload_id: string;
  file_name: string;
  overall_score: number;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  job_title?: string;
}

interface PastAnalysisSidebarProps {
  analyses: PastAnalysisItem[];
  onReanalyze?: (uploadId: string) => void;
}

export function PastAnalysisSidebar({ analyses, onReanalyze }: PastAnalysisSidebarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  if (analyses.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Past Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No past analyses yet.</p>
            <p className="text-xs mt-1">Upload a resume to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Past Analyses
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {analyses.length} resume{analyses.length !== 1 ? 's' : ''} analyzed
        </p>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-300px)] px-4">
          <div className="space-y-2 pb-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.analysis_id}
                className="group flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Link
                  href={`/resume-score?id=${analysis.upload_id}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  {getStatusIcon(analysis.status)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {analysis.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  {analysis.status === 'completed' ? (
                    <Badge
                      variant="outline"
                      className={`${getScoreColor(analysis.overall_score)} font-semibold text-xs`}
                    >
                      {analysis.overall_score}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="capitalize text-xs">
                      {analysis.status}
                    </Badge>
                  )}
                  
                  {onReanalyze && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onReanalyze(analysis.upload_id)}
                      title="Re-analyze resume"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Link href={`/resume-score?id=${analysis.upload_id}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
