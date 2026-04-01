import type { SupabaseClient } from '@supabase/supabase-js';

// Generic invoker for Supabase Edge Functions
// Reason: Centralize headers, timeouts, and error handling for consistent behavior across the app
export type InvokeOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
};

// Constrain TReq to the valid supabase.functions.invoke body types to satisfy TS
export async function invokeEdgeFunction<
  TReq extends
  | string
  | File
  | Blob
  | ArrayBuffer
  | FormData
  | ReadableStream<Uint8Array>
  | Record<string, unknown>
  | undefined,
  TRes = unknown
>(
  supabase: SupabaseClient,
  name: string,
  body: TReq,
  opts: InvokeOptions = {}
): Promise<TRes> {
  const timeoutMs = opts.timeoutMs ?? 30000;

  // Promise.race-based timeout (supabase.functions.invoke does not accept AbortSignal)
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Edge function '${name}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const invokePromise = supabase.functions.invoke<TRes>(name, {
    body,
    headers: opts.headers,
  });

  const result: { data: TRes | null; error: any } = await Promise.race<any>([
    invokePromise,
    timeoutPromise,
  ]);

  const { data, error } = result;
  if (error) {
    const errObj = error as any;
    const details = {
      name: errObj?.name,
      message: errObj?.message,
      status: errObj?.status,
      context: errObj?.context,
    };
    // Log full error for diagnostics (no secrets here)
    console.error('[edge][invoke]', name, 'failed:', details);
    const msg = details.message || 'Edge function invocation failed';
    throw new Error(`${name} failed: ${msg}${details.status ? ` (status ${details.status})` : ''}`);
  }

  return data as TRes;
}
