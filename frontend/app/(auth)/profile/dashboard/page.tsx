import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AnalysisHistoryWidget } from '@/app/components/dashboard/AnalysisHistoryWidget';
import { getUserAnalysisHistory } from '@/app/lib/repositories/analysisHistoryRepo';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Fetch analysis history
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const analyses = await getUserAnalysisHistory(supabase, user.id, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Today's focus</CardTitle>
              <CardDescription>
                Keep your resume ready, tailored, and easy to export.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/profile/resumes" className="block">
                  <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-4 transition-colors hover:bg-accent/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Open Resume Library</div>
                        <div className="mt-1 text-xs text-muted-foreground">Preview, duplicate, export PDFs</div>
                      </div>
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </Link>
                <Link href="/resume-score" className="block">
                  <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-card p-4 transition-colors hover:bg-accent/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Check Resume Score</div>
                        <div className="mt-1 text-xs text-muted-foreground">See what to improve next</div>
                      </div>
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </Link>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Profile completeness</div>
                    <div className="mt-1 text-xs text-muted-foreground">A complete profile exports better and faster.</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    68%
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={68} className="h-2" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline">
                    Add projects
                  </Button>
                  <Button variant="outline">
                    Add skills
                  </Button>
                  <Button variant="outline">
                    Add summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis History Widget */}
          <AnalysisHistoryWidget analyses={analyses} maxItems={5} />
        </div>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Do the next most valuable thing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between" asChild>
              <Link href="/profile/resumes">
                Manage resumes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/resume-gallery">
                Pick a template
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/resume-score">
                Run resume score
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
