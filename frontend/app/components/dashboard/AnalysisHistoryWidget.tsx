'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, TrendingUp, AlertCircle, Clock, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AnalysisHistoryItem {
  analysis_id: string;
  upload_id: string;
  file_name: string;
  overall_score: number;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  job_title?: string;
}

interface AnalysisHistoryWidgetProps {
  analyses: AnalysisHistoryItem[];
  maxItems?: number;
}

export function AnalysisHistoryWidget({ analyses, maxItems = 5 }: AnalysisHistoryWidgetProps) {
  const displayAnalyses = analyses.slice(0, maxItems);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 70) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resume Analysis History
          </CardTitle>
          <CardDescription>Your analyzed resumes will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No analyses yet. Upload your first resume to get started!</p>
            <Button asChild className="mt-4">
              <Link href="/resume-score">Analyze Resume</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resume Analysis History
        </CardTitle>
        <CardDescription>{analyses.length} resume{analyses.length !== 1 ? 's' : ''} analyzed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayAnalyses.map((analysis) => (
            <Link
              key={analysis.analysis_id}
              href={`/resume-score?id=${analysis.upload_id}`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getStatusIcon(analysis.status)}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {analysis.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                    {analysis.job_title && ` • ${analysis.job_title}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {analysis.status === 'completed' ? (
                  <Badge
                    variant={getScoreBadgeVariant(analysis.overall_score)}
                    className={`${getScoreColor(analysis.overall_score)} font-semibold`}
                  >
                    {analysis.overall_score}/100
                  </Badge>
                ) : (
                  <Badge variant="outline" className="capitalize">
                    {analysis.status}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        {analyses.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/resumes">View All Analyses</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
