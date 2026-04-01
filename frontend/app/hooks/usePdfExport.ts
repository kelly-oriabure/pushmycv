import { useState } from 'react';
import { 
  exportElementToPDF,
  exportResumeTemplateToPDF,
  getElementAsPdfBase64,
  exportElementToPDFWithPuppeteer,
  exportResumeTemplateToPDFWithPuppeteer,
  getElementAsPdfBase64WithPuppeteer
} from '@/lib/utils/pdfExportUtils';

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [usePuppeteer, setUsePuppeteer] = useState(true); // Default to Puppeteer

  /**
   * Export an HTML element to PDF and trigger download
   * @param element - The HTML element to export
   * @param filename - The filename for the exported PDF
   * @returns Promise<boolean> - Whether the export was successful
   */
  const exportToPdf = async (
    element: HTMLElement,
    filename: string = 'document.pdf'
  ): Promise<boolean> => {
    if (isExporting) return false;
    
    setIsExporting(true);
    try {
      // Use Puppeteer if enabled, fallback to HTML2Canvas
      const success = usePuppeteer 
        ? await exportElementToPDFWithPuppeteer(element, { filename, format: 'a4' })
        : await exportElementToPDF(element, {
            filename,
            margin: 0,
            format: 'a4',
            useFullPage: true,
            scale: 6
          });
          
      return success;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export a resume template to PDF with proper formatting
   * @param element - The resume template element to export
   * @param filename - The filename for the exported PDF
   * @returns Promise<boolean> - Whether the export was successful
   */
  const exportResumeTemplateToPdf = async (
    element: HTMLElement,
    filename: string = 'resume.pdf'
  ): Promise<boolean> => {
    if (isExporting) return false;
    
    setIsExporting(true);
    try {
      // Use Puppeteer if enabled, fallback to HTML2Canvas
      const success = usePuppeteer
        ? await exportResumeTemplateToPDFWithPuppeteer(element, {
            filename,
            format: 'a4',
            useFullPage: true
          })
        : await exportResumeTemplateToPDF(element, {
            filename,
            margin: 0,
            format: 'a4',
            useFullPage: true,
            scale: 6,
            noHeaderMargin: true
          });
          
      return success;
    } catch (error) {
      console.error('Error exporting resume template to PDF:', error);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Get an HTML element as a base64 encoded PDF
   * @param element - The HTML element to export
   * @returns Promise<string|null> - Base64 encoded PDF or null if failed
   */
  const getElementAsPdf = async (
    element: HTMLElement
  ): Promise<string | null> => {
    if (isExporting) return null;
    
    setIsExporting(true);
    try {
      // Use Puppeteer if enabled, fallback to HTML2Canvas
      const base64 = usePuppeteer
        ? await getElementAsPdfBase64WithPuppeteer(element, {
            format: 'a4',
            useFullPage: true
          })
        : await getElementAsPdfBase64(element, {
            margin: 0,
            format: 'a4',
            useFullPage: true,
            scale: 6
          });
          
      return base64;
    } catch (error) {
      console.error('Error generating PDF from element:', error);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Toggle between Puppeteer and HTML2Canvas approaches
   */
  const togglePdfEngine = () => {
    setUsePuppeteer(prev => !prev);
  };

  return {
    isExporting,
    exportToPdf,
    exportResumeTemplateToPdf,
    getElementAsPdf,
    usePuppeteer,
    togglePdfEngine
  };
};