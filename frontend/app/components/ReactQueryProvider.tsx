'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useRef } from 'react';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // Cache data for 5 minutes
          staleTime: 1000 * 60 * 5,
          // Keep unused data in cache for 10 minutes
          gcTime: 1000 * 60 * 10,
          // Retry failed queries 3 times
          retry: 3,
          // Enable background refetching
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          refetchOnMount: true,
        },
      },
    });
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}