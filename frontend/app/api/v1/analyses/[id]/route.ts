import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { applyRateLimit, rateLimit429, setRateLimitHeaders } from '@/app/lib/rateLimit';
import { GET as innerGET } from '@/api/resume-score/analysis/[id]/route';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Identify user (for per-user rate limit);
  let userId: string | null = null;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {}

  const key = userId ? `u:${userId}:analyses-get` : `ip:${request.headers.get('x-forwarded-for') || 'unknown'}:analyses-get`;
  const rl = applyRateLimit(key, { windowMs: 60_000, max: 60, keyPrefix: 'v1' });
  if (!rl.allowed) {
    return rateLimit429(rl);
  }

  const { id } = await params;
  const resp = await (innerGET as any)(request as any, { params: Promise.resolve({ id }) } as any);
  setRateLimitHeaders(resp, rl);
  return resp;
}
