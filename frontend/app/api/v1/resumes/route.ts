import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { applyRateLimit, rateLimit429, setRateLimitHeaders } from '@/app/lib/rateLimit';
import { POST as uploadPOST } from '@/api/resume-score/upload/route';

function getIp(req: NextRequest) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  // Compute rate limit key (prefer user.id)
  let userId: string | null = null;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // ignore; fallback to IP-based key
  }
  const key = userId ? `u:${userId}:upload` : `ip:${getIp(request)}:upload`;

  const rl = applyRateLimit(key, { windowMs: 60_000, max: 10, keyPrefix: 'v1' });
  if (!rl.allowed) {
    return rateLimit429(rl);
  }

  // Delegate to existing upload handler
  const response = await uploadPOST(request);
  setRateLimitHeaders(response, rl);
  return response;
}
