import React from 'react';
import { notFound } from 'next/navigation';
import { dummyResumeData } from '@/data/dummyData';
import { ConfigDrivenTemplate } from '@/components/resume/templates/ConfigDrivenTemplate';

const TemplatePreviewPage = async (props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const params = await props.searchParams;
  const raw = params?.template;
  const template = Array.isArray(raw) ? raw[0] : raw;
  const templateKey = template || 'simple-white';

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-[21cm]">
        <ConfigDrivenTemplate templateKey={templateKey} data={dummyResumeData} color="#3b82f6" />
      </div>
    </div>
  );
};

export default TemplatePreviewPage;
