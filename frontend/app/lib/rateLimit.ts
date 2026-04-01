import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory sliding window rate limiter for dev/local usage.
// For production, replace with Upstash Redis-based limiter.
// Reason: Provide immediate protections and headers without adding dependencies.

type WindowEntry = number[]; // timestamps (ms)

const windows = new Map<string, WindowEntry>();

export type RateLimitOptions = {
  windowMs: number; // time window in ms
  max: number; // max requests allowed within window
  keyPrefix?: string; // optional namespace
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number; // epoch ms when window resets
  retryAfterSec?: number;
};

function now() {
  return Date.now();
}

function prune(entries: WindowEntry, startThreshold: number) {
  // remove timestamps older than startThreshold
  while (entries.length && entries[0] <= startThreshold) {
    entries.shift();
  }
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown';
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  // NextRequest doesn't always expose req.ip; fallback
  return 'unknown';
}

export function rateLimitKey(req: NextRequest, id: string, prefix?: string) {
  const ip = getClientIp(req);
  return `${prefix || 'rl'}:${id}:${ip}`;
}

export function applyRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const start = now() - opts.windowMs;
  const list = windows.get(key) || [];
  prune(list, start);

  const allowed = list.length < opts.max;
  if (allowed) {
    list.push(now());
    windows.set(key, list);
  }

  // next reset time: oldest entry + windowMs, or now + windowMs if empty
  const oldest = list[0] ?? now();
  const resetMs = oldest + opts.windowMs;
  const remaining = Math.max(0, opts.max - list.length);

  return {
    allowed,
    limit: opts.max,
    remaining,
    resetMs,
    retryAfterSec: allowed ? undefined : Math.ceil((resetMs - now()) / 1000),
  };
}

export function setRateLimitHeaders(res: NextResponse, info: RateLimitResult) {
  res.headers.set('RateLimit-Limit', String(info.limit));
  res.headers.set('RateLimit-Remaining', String(info.remaining));
  res.headers.set('RateLimit-Reset', String(Math.ceil(info.resetMs / 1000))); // seconds epoch
  if (!info.allowed && info.retryAfterSec != null) {
    res.headers.set('Retry-After', String(info.retryAfterSec));
  }
}

export function rateLimit429(info: RateLimitResult) {
  const res = NextResponse.json(
    { error: 'Too Many Requests' },
    { status: 429 }
  );
  setRateLimitHeaders(res, info);
  return res;
}

// Generic wrapper for Next.js route handlers
export function withRateLimit<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (req: NextRequest, ...args: any[]) => Promise<NextResponse>
>(
  handler: T,
  {
    getKey,
    options,
  }: {
    getKey: (req: NextRequest) => string;
    options: RateLimitOptions;
  }
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (req: NextRequest, ...args: any[]) => {
    const key = getKey(req);
    const info = applyRateLimit(key, options);
    if (!info.allowed) {
      return rateLimit429(info);
    }

    const resp = await handler(req, ...args);
    setRateLimitHeaders(resp, info);
    return resp;
  }) as T;
}
