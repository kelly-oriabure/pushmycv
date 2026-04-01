"use client";

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResumeBuilderRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateId = searchParams?.get('templateId');
  const templateName = searchParams?.get('templateName');
  const resumeId = searchParams?.get('resumeId');

  useEffect(() => {
    if (resumeId) {
      let redirectUrl = `/resume/builder/${resumeId}`;
      const queryParams = [] as string[];
      if (templateId) queryParams.push(`templateId=${templateId}`);
      if (templateName) queryParams.push(`templateName=${templateName}`);
      if (queryParams.length > 0) {
        redirectUrl += `?${queryParams.join('&')}`;
      }
      router.replace(redirectUrl);
    } else {
      router.replace('/resume-gallery');
    }
  }, [resumeId, templateId, templateName, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the correct page.</p>
      </div>
    </div>
  );
}

export default function ResumeBuilderRedirect() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResumeBuilderRedirectInner />
    </Suspense>
  );
}
