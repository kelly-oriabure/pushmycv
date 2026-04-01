'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ScoreDashboardProps {
  analysisResults?: WorkflowResponse;
  isInitialLoading?: boolean;
  uploadId?: string;
  fileName?: string;
}

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

export function ScoreDashboard({ analysisResults, isInitialLoading = false, uploadId, fileName }: ScoreDashboardProps) {
  const [workflowResponse, setWorkflowResponse] = useState<WorkflowResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | undefined>(undefined);

  const toDisplayString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      const maybeRecord = value as Record<string, unknown>;
      const name = maybeRecord.name;
      if (typeof name === 'string') return name;
      const message = maybeRecord.message;
      if (typeof message === 'string') return message;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getAnalysisProperty = (data: any, key: string, suffix: string): string | undefined => {
    const propName = `${key}${suffix}`;
    const value = data[propName];
    return value === null ? undefined : (value as string | undefined);
  };

  const transformAnalysisDataToCategories = (analysisData: any): CategoryResult[] => {
    // Debug: log what we received
    console.log('[ScoreDashboard] Received analysisData:', analysisData);
    console.log('[ScoreDashboard] score_breakdown:', analysisData?.score_breakdown);

    // Map score categories to their detailed analysis fields
    const scoreMappings = [
      { key: 'ats', label: 'ATS Compatibility', explanationField: 'ats_explanation', tipsField: 'ats_tips_tip' },
      { key: 'content', label: 'Content Quality', explanationField: 'content_explanation', tipsField: 'content_tips_tip' },
      { key: 'structure', label: 'Structure & Formatting', explanationField: 'structure_explanation', tipsField: 'structure_tips_tip' },
      { key: 'skills', label: 'Skills Match', explanationField: 'skills_explanation', tipsField: 'skills_tips_tip' },
      { key: 'email', label: 'Email & Contact', explanationField: 'email_explanation', tipsField: 'email_tips_tip' },
      { key: 'tone', label: 'Tone & Style', explanationField: 'tone_explanation', tipsField: 'tone_tips_tip' }
    ];

    const categories: CategoryResult[] = [];
    const breakdown = analysisData?.score_breakdown;

    scoreMappings.forEach(mapping => {
      // Get score from score_breakdown or individual field
      const score = breakdown?.[mapping.key] ?? analysisData?.[`${mapping.key}_score`];

      if (score !== null && score !== undefined) {
        const scoreNum = Math.max(0, Math.min(100, Math.round(score)));

        // Get explanation from multiple possible sources
        let explanation = '';

        // 1. Try the explanation field directly from analysisData
        const directExplanation = analysisData?.[mapping.explanationField];
        if (directExplanation && typeof directExplanation === 'string' && directExplanation.length > 10) {
          explanation = directExplanation;
        }
        // 2. Try nested in score_breakdown with _analysis suffix
        else if (breakdown?.[`${mapping.key}_analysis`] && typeof breakdown[`${mapping.key}_analysis`] === 'string' && breakdown[`${mapping.key}_analysis`].length > 10) {
          explanation = breakdown[`${mapping.key}_analysis`];
        }
        // 3. Fallback to basic explanation
        else {
          if (scoreNum >= 80) explanation = `Your ${mapping.label.toLowerCase()} is excellent.`;
          else if (scoreNum >= 60) explanation = `Your ${mapping.label.toLowerCase()} is good but could be improved.`;
          else if (scoreNum >= 40) explanation = `Your ${mapping.label.toLowerCase()} needs improvement.`;
          else explanation = `Your ${mapping.label.toLowerCase()} needs significant work.`;
        }

        // Get tips from multiple possible sources
        let tips: string[] | undefined = undefined;

        // 1. Try the tips field directly
        const directTips = analysisData?.[mapping.tipsField];
        if (directTips) {
          tips = Array.isArray(directTips) ? directTips : [directTips];
        }
        // 2. Try nested in score_breakdown
        else if (breakdown?.[`${mapping.key}_tips`]) {
          const breakdownTips = breakdown[`${mapping.key}_tips`];
          tips = Array.isArray(breakdownTips) ? breakdownTips : [breakdownTips];
        }

        categories.push({
          category: mapping.label,
          score: scoreNum,
          category_key: mapping.key,
          explanation: explanation,
          tips: tips
        });
      }
    });

    if (categories.length > 0) {
      return categories;
    }

    // Fallback to old format
    if (Array.isArray(analysisData?.categories) && analysisData.categories.length > 0) {
      return analysisData.categories.map((category: CategoryResult, index: number) => ({
        category: category.category ?? `Category ${index + 1}`,
        score: Math.max(0, Math.min(100, Math.round(category.score ?? 0))),
        type: category.type,
        tips: Array.isArray(category.tips)
          ? category.tips
          : category.tips
            ? [category.tips]
            : undefined,
        explanation: category.explanation,
        category_key: category.category_key ?? category.category?.toLowerCase().replace(/\s+/g, '_'),
        tips_type: category.tips_type ?? category.type
      }));
    }

    return [];
  };

  useEffect(() => {
    if (analysisResults) {
      const cats = transformAnalysisDataToCategories(analysisResults);
      const computedOverall = (analysisResults as any)?.overall_score ?? (cats.length > 0
        ? Math.round(cats.reduce((sum, c) => sum + (c.score || 0), 0) / cats.length)
        : 0);

      setWorkflowResponse({
        ...analysisResults,
        overall_score: computedOverall,
        categories: cats
      });
      setIsLoadingAnalysis(false);
      setAnalysisError(null);
    } else if (!isInitialLoading) {
      setIsLoadingAnalysis(true);
    }
  }, [analysisResults, isInitialLoading]);

  useEffect(() => {
    if (workflowResponse?.categories && workflowResponse.categories.length > 0) {
      setExpandedCategory('cat-0');
    }
  }, [workflowResponse?.categories?.length]);

  useEffect(() => {
    if (isInitialLoading) {
      setIsLoadingAnalysis(true);
      setAnalysisError(null);
    }
  }, [isInitialLoading]);

  // Polling logic
  useEffect(() => {
    const shouldPoll = uploadId && (
      !workflowResponse?.overall_score ||
      workflowResponse?.overall_score === 0 ||
      isLoadingAnalysis
    );

    if (!shouldPoll) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/resume-score/status/${uploadId}`);
        if (!response.ok) return;

        const data = await response.json();

        if (data.status === 'completed' || (data.overall_score && data.overall_score > 0)) {
          const categories = transformAnalysisDataToCategories(data);
          setWorkflowResponse({
            overall_score: data.overall_score || 0,
            skills_match: data.skills_score,
            experience: data.content_score,
            formatting: data.structure_score,
            keywords: data.ats_score,
            recommendations: data.suggestions,
            categories
          });
          setIsLoadingAnalysis(false);
          setAnalysisError(null);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setAnalysisError(data.error_message || 'Analysis failed');
          setIsLoadingAnalysis(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [uploadId, workflowResponse, isLoadingAnalysis]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-white border-gray-200">
        <CardContent className="py-6">
          {isLoadingAnalysis ? (
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">Overall Score</span>
              <div className="flex items-center text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                <span>Analyzing...</span>
              </div>
            </div>
          ) : analysisError ? (
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">Overall Score</span>
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{analysisError}</span>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="ml-3"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          ) : workflowResponse ? (
            <>
              <div className="flex items-baseline justify-between">
                <CardTitle>
                  <span className="text-gray-900">Overall Score</span>
                </CardTitle>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-blue-600 leading-none">
                    {workflowResponse.overall_score || 0}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">/100</span>
                </div>
              </div>
              <div className="relative mt-4">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${(workflowResponse.overall_score || 0) >= 70
                      ? 'bg-green-600'
                      : (workflowResponse.overall_score || 0) >= 50
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                      }`}
                    style={{ width: `${workflowResponse.overall_score || 0}%` }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <p>Score will appear here after analysis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Insights */}
      {workflowResponse?.categories && workflowResponse.categories.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Resume Insights
              </div>
              {fileName && (
                <span className="font-normal  truncate max-w-[300px]">
                  {fileName}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              type="single"
              collapsible
              value={expandedCategory || ''}
              onValueChange={setExpandedCategory}
              className="space-y-2"
            >
              {workflowResponse.categories.map((c, idx) => {
                const titleKey = c.category_key ?? c.category;
                const titleType = c.tips_type ?? c.type;

                const getScoreColor = (score: number) => {
                  if (score >= 70) return 'text-green-600 border-green-200 bg-green-50';
                  if (score >= 50) return 'text-orange-600 border-orange-200 bg-orange-50';
                  return 'text-red-600 border-red-200 bg-red-50';
                };

                const getProgressColor = (score: number) => {
                  if (score >= 70) return 'bg-green-600';
                  if (score >= 50) return 'bg-orange-500';
                  return 'bg-red-500';
                };

                return (
                  <AccordionItem
                    value={`cat-${idx}`}
                    key={`${titleKey}-${idx}`}
                    className={`rounded-lg border ${getScoreColor(c.score)}`}
                  >
                    <AccordionTrigger className="px-4 py-3">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium capitalize">{titleKey}</span>
                          {titleType && (
                            <span className="text-xs opacity-75 capitalize">({titleType})</span>
                          )}
                        </div>
                        <span className="font-semibold">{c.score}/100</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(c.score)}`}
                          style={{ width: `${c.score}%` }}
                        ></div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-blue-700 mb-2">Analysis</p>
                        <p className="text-sm text-gray-600">
                          {toDisplayString(c.explanation) || 'No detailed analysis available.'}
                        </p>
                      </div>

                      {Array.isArray(c.tips) && c.tips.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h4 className="text-sm font-semibold text-blue-700 mb-2">
                            Improvement Tips
                          </h4>
                          <ul className="text-sm space-y-2">
                            {c.tips.map((tip, idx2) => (
                              <li key={idx2} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span className="text-gray-700">{toDisplayString(tip)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-gray-300 text-gray-900 hover:bg-gray-100"
        >
          Improve Your Resume
        </Button>
      </div>

      {/* Suggestions / Improvement Tips */}
      {workflowResponse?.recommendations && workflowResponse.recommendations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {workflowResponse.recommendations.map((tip, idx) => (
                <li key={idx} className="flex items-start text-blue-800">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  <span>{toDisplayString(tip)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
