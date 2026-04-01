'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import '../styles/nprogress.css';

// Configure NProgress
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
});

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathname = useRef(pathname);
  const prevSearchParams = useRef(searchParams?.toString());

  useEffect(() => {
    const currentPath = pathname;
    const currentSearch = searchParams?.toString();
    
    // Check if route actually changed
    if (prevPathname.current !== currentPath || prevSearchParams.current !== currentSearch) {
      // Route is changing, complete any existing progress
      NProgress.done();
      
      // Update refs
      prevPathname.current = currentPath;
      prevSearchParams.current = currentSearch;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Handle link clicks to start progress
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        // Only start progress for different routes
        if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
          NProgress.start();
        }
      }
    };

    // Handle form submissions
    const handleFormSubmit = () => {
      NProgress.start();
    };

    // Handle browser back/forward navigation
    const handlePopState = () => {
      NProgress.start();
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleFormSubmit);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleFormSubmit);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      NProgress.done();
    };
  }, []);

  return null;
}

export default function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}