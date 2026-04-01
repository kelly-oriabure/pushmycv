'use client';

import { useState, useRef } from 'react';
import { usePdfExport } from '@/hooks/usePdfExport';

export default function TestInlineStyling() {
  const { exportToPdf, isExporting } = usePdfExport();
  const [testContent, setTestContent] = useState('This is a test resume content for PDF generation.');
  const templateRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (templateRef.current) {
      const success = await exportToPdf(templateRef.current, 'test-resume-inline.pdf');
      if (success) {
        console.log('PDF exported successfully');
      } else {
        console.error('Failed to export PDF');
      }
    }
  };

  // Example of a header with extensive inline styling
  const HeaderSection = () => (
    <header 
      style={{
        width: '100%',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '20px',
        margin: 0,
        textAlign: 'center',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '0 0 10px 0',
        color: 'white',
      }}>
        John Doe
      </h1>
      <p style={{
        fontSize: '16px',
        margin: 0,
        color: 'white',
      }}>
        Software Engineer
      </p>
    </header>
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inline Styling PDF Test</h1>
        
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
          {isExporting ? 'Exporting...' : 'Export to PDF with Inline Styling'}
        </button>
        
        <div className="mt-8 p-6 bg-white border rounded">
          <h2 className="text-xl font-semibold mb-4">Preview (with inline styling):</h2>
          <div 
            ref={templateRef} 
            className="resume-template"
            style={{ 
              width: '21cm', 
              minHeight: '29.7cm',
              backgroundColor: 'white',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
            }}
          >
            <HeaderSection />
            <div style={{ padding: '20px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#1e293b',
              }}>
                Professional Summary
              </h2>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#334155',
                marginBottom: '15px',
              }}>
                {testContent}
              </p>
              
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#1e293b',
              }}>
                Experience
              </h2>
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                borderLeft: '3px solid #2563eb',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: '0 0 5px 0',
                  color: '#1e293b',
                }}>
                  Senior Software Engineer
                </h3>
                <p style={{
                  fontSize: '14px',
                  fontStyle: 'italic',
                  margin: '0 0 5px 0',
                  color: '#64748b',
                }}>
                  Tech Company Inc. | 2020 - Present
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#334155',
                }}>
                  Led development of multiple web applications using React and Node.js.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}