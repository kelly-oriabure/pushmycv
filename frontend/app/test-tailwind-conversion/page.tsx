'use client';

import { useState, useRef } from 'react';
import { usePdfExport } from '@/hooks/usePdfExport';

export default function TestTailwindConversion() {
  const { exportToPdf, isExporting } = usePdfExport();
  const [testContent, setTestContent] = useState('This is a test resume content for PDF generation with Tailwind conversion.');
  const templateRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (templateRef.current) {
      const success = await exportToPdf(templateRef.current, 'test-tailwind-conversion.pdf');
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
        <h1 className="text-3xl font-bold mb-6">Tailwind to Inline Styling PDF Test</h1>
        
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
          {isExporting ? 'Exporting...' : 'Export to PDF with Tailwind Conversion'}
        </button>
        
        <div className="mt-8 p-6 bg-white border rounded">
          <h2 className="text-xl font-semibold mb-4">Preview (with Tailwind classes):</h2>
          <div 
            ref={templateRef} 
            className="resume-template w-full bg-white"
            style={{ 
              width: '21cm', 
              minHeight: '29.7cm',
            }}
          >
            {/* Header with Tailwind classes */}
            <header className="w-full bg-blue-600 text-white p-6 text-center">
              <h1 className="text-2xl font-bold mb-2">John Doe</h1>
              <p className="text-lg">Senior Software Engineer</p>
            </header>
            
            {/* Content with Tailwind classes */}
            <div className="p-6">
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  Professional Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {testContent}
                </p>
              </section>
              
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  Experience
                </h2>
                <div className="mb-4 p-4 border-l-4 border-blue-500 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">Senior Software Engineer</h3>
                  <p className="text-gray-600 italic">Tech Company Inc. | 2020 - Present</p>
                  <p className="text-gray-700 mt-2">
                    Led development of multiple web applications using React and Node.js.
                  </p>
                </div>
              </section>
              
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Node.js</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">TypeScript</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Next.js</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}