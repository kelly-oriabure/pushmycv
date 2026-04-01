'use client';

import { useState, useRef } from 'react';
import { usePdfExport } from '@/hooks/usePdfExport';

export default function TestPdfGeneration() {
  const { exportToPdf, isExporting } = usePdfExport();
  const [testContent, setTestContent] = useState('This is a test resume content for PDF generation.');
  const templateRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (templateRef.current) {
      const success = await exportToPdf(templateRef.current, 'test-resume.pdf');
      if (success) {
        console.log('PDF exported successfully');
      } else {
        console.error('Failed to export PDF');
      }
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">PDF Generation Test</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Test Content:</label>
          <textarea
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export to PDF'}
        </button>
        
        <div className="mt-8 p-6 bg-white border rounded">
          <h2 className="text-xl font-semibold mb-4">Preview:</h2>
          <div 
            ref={templateRef} 
            className="resume-template p-6 border rounded"
            style={{ 
              width: '21cm', 
              minHeight: '29.7cm',
              backgroundColor: 'white'
            }}
          >
            <h1 className="text-2xl font-bold mb-4">Test Resume</h1>
            <div className="prose" dangerouslySetInnerHTML={{ __html: testContent }} />
          </div>
        </div>
      </div>
    </div>
  );
}