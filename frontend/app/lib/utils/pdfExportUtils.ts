import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;
  scale?: number;
  format?: [number, number] | string;
  margin?: number;
  useFullPage?: boolean;
  noHeaderMargin?: boolean;
  returnBase64?: boolean;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
}

// ===== Helper utilities =====

const INLINE_COMPUTED_STYLE_PROPERTIES = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'box-sizing',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'overflow',
  'overflow-x',
  'overflow-y',
  'overflow-wrap',
  'word-break',
  'white-space',
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'gap',
  'row-gap',
  'column-gap',
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-auto-flow',
  'grid-auto-columns',
  'grid-auto-rows',
  'place-items',
  'place-content',
  'place-self',
  'justify-items',
  'justify-self',
  'order',
  'float',
  'clear',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'font-stretch',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-align',
  'text-decoration',
  'text-decoration-line',
  'text-decoration-style',
  'text-decoration-color',
  'text-rendering',
  'color',
  'background',
  'background-color',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-width',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-style',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-radius',
  'box-shadow',
  'opacity',
  'transform',
  'transform-origin',
  'filter',
  'outline',
  'outline-color',
  'outline-width',
  'outline-style',
  'clip-path',
  'list-style',
  'list-style-type',
  'list-style-position',
  'list-style-image',
  'table-layout',
  'border-collapse',
  'border-spacing',
  'vertical-align',
  'text-overflow',
  'object-fit',
  'object-position',
  'fill',
  'stroke',
  'stroke-width',
] as const;

function parsePx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function applyCircularImageClipping(root: HTMLElement): void {
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLElement[];
  for (const imgEl of imgs) {
    const img = imgEl as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    const cs = window.getComputedStyle(img);
    const br = parsePx(cs.borderTopLeftRadius || cs.borderRadius);
    const minSide = Math.min(rect.width, rect.height);

    if (minSide > 0 && br >= minSide * 0.45) {
      img.style.borderRadius = '9999px';
      img.style.clipPath = 'circle(50% at 50% 50%)';
      img.style.setProperty('-webkit-clip-path', 'circle(50% at 50% 50%)');
      img.style.objectFit = img.style.objectFit || 'cover';
      img.style.display = img.style.display || 'block';
    }
  }
}

function absolutizeUrl(url: string, baseHref: string): string {
  try {
    if (!url) return url;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('mailto:')) return url;
    if (url.startsWith('tel:')) return url;
    if (url.startsWith('#')) return url;
    return new URL(url, baseHref).toString();
  } catch {
    return url;
  }
}

function absolutizeCssUrls(cssValue: string, baseHref: string): string {
  if (!cssValue || !cssValue.includes('url(')) return cssValue;
  return cssValue.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_m, quote, rawUrl) => {
    const safe = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    const abs = absolutizeUrl(safe, baseHref);
    const q = quote || '"';
    return `url(${q}${abs}${q})`;
  });
}

function makeAssetUrlsAbsolute(root: HTMLElement, baseHref: string): void {
  const imgs = root.querySelectorAll('img');
  imgs.forEach(img => {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.src) img.src = absolutizeUrl(img.getAttribute('src') || img.src, baseHref);
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const parts = srcset
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(entry => {
          const [u, descriptor] = entry.split(/\s+/);
          const abs = absolutizeUrl(u, baseHref);
          return descriptor ? `${abs} ${descriptor}` : abs;
        });
      img.setAttribute('srcset', parts.join(', '));
    }
  });

  const anchors = root.querySelectorAll('a[href]');
  anchors.forEach(a => {
    if (!(a instanceof HTMLAnchorElement)) return;
    const href = a.getAttribute('href');
    if (!href) return;
    a.setAttribute('href', absolutizeUrl(href, baseHref));
  });
}

function applyInlineComputedStyles(sourceRoot: HTMLElement, targetRoot: HTMLElement): void {
  const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll('*'))];
  const targetElements = [targetRoot, ...Array.from(targetRoot.querySelectorAll('*'))];
  const count = Math.min(sourceElements.length, targetElements.length);

  for (let i = 0; i < count; i++) {
    const source = sourceElements[i];
    const target = targetElements[i];
    if (!(source instanceof Element) || !(target instanceof Element)) continue;

    const sourceStyle = window.getComputedStyle(source as Element);
    const targetStyle = (target as unknown as { style?: CSSStyleDeclaration }).style;
    if (!targetStyle) continue;

    for (const prop of INLINE_COMPUTED_STYLE_PROPERTIES) {
      const value = sourceStyle.getPropertyValue(prop);
      if (!value) continue;
      const priority = sourceStyle.getPropertyPriority(prop);
      targetStyle.setProperty(prop, value, priority);
    }

    const bgImage = (targetStyle as CSSStyleDeclaration).getPropertyValue('background-image');
    if (bgImage && bgImage.includes('url(')) {
      (targetStyle as CSSStyleDeclaration).setProperty('background-image', absolutizeCssUrls(bgImage, window.location.origin));
    }
  }
}

function cloneTemplateForPuppeteer(source: HTMLElement, baseHref: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = '210mm';
  wrapper.style.height = '297mm';
  wrapper.style.margin = '0';
  wrapper.style.padding = '0';
  wrapper.style.opacity = '0';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.overflow = 'hidden';

  const measured = source.cloneNode(true) as HTMLElement;
  measured.style.width = '210mm';
  measured.style.minWidth = '210mm';
  measured.style.maxWidth = '210mm';
  measured.style.height = '297mm';
  measured.style.minHeight = '297mm';
  measured.style.maxHeight = '297mm';
  measured.style.margin = '0';
  measured.style.padding = '0';
  measured.style.overflow = 'visible';
  measured.style.boxSizing = 'border-box';
  measured.style.transform = 'none';
  measured.style.transformOrigin = 'unset';

  wrapper.appendChild(measured);
  document.body.appendChild(wrapper);

  try {
    applyCircularImageClipping(measured);
    const clone = measured.cloneNode(true) as HTMLElement;
    applyInlineComputedStyles(measured, clone);
    applyCircularImageClipping(clone);
    clone.style.width = '210mm';
    clone.style.minWidth = '210mm';
    clone.style.maxWidth = '210mm';
    clone.style.height = '297mm';
    clone.style.minHeight = '297mm';
    clone.style.maxHeight = '297mm';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.overflow = 'visible';
    clone.style.boxSizing = 'border-box';
    makeAssetUrlsAbsolute(clone, baseHref);
    return clone;
  } finally {
    wrapper.remove();
  }
}

// ===== Shared CSS for Puppeteer HTML documents =====

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function getPdfBaseCss(): string {
  return `
    html, body { margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    img, svg { max-width: 100%; height: auto; }
    a { text-decoration: none; color: inherit; }
    #pdf-root { width: 210mm; min-height: 297mm; margin: 0; padding: 0; overflow: visible; }
    html { text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; }
  `;
}

function getPdfPrintCss(): string {
  return `
    @media print {
      @page { size: 210mm 297mm; margin: 0; }
      html, body { width: 210mm; height: 297mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
      #pdf-root { width: 210mm; height: 297mm; }
      img { max-width: 100%; height: auto; }
      a { text-decoration: none; color: inherit; }
    }
  `;
}

function getResumeTemplatePrintCss(): string {
  return `
    @media print {
      .resume-preview-stage { transform: none !important; }
      [data-resume-template] {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        min-width: 21cm !important;
        min-height: 29.7cm !important;
        padding: 0 !important;
        margin: 0 !important;
        transform: none !important;
        transform-origin: unset !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      [data-resume-template],
      [data-resume-template] * {
        overflow: visible !important;
      }
    }
  `;
}

function buildPdfHtmlDocument(title: string, htmlContent: string, baseHref?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${baseHref ? `<base href="${baseHref.endsWith('/') ? baseHref : `${baseHref}/`}">` : ''}
        <title>${title}</title>
        <style>${getPdfBaseCss()}</style>
        <style>${getResumeTemplatePrintCss()}</style>
      </head>
      <body style="margin: 0; padding: 0;">
        <div id="pdf-root">${htmlContent}</div>
        <style>${getPdfPrintCss()}</style>
      </body>
    </html>
  `;
}

/**
 * Enhanced version of the original HTML-based export with improved quality
 * @param element - The HTML element to export
 * @param options - Export options
 * @returns Promise<boolean> - Whether the export was successful
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  try {
    const {
      filename = 'document.pdf',
      scale = 6
    } = options;

    // Temporarily reset transform for proper capture
    const originalTransform = element.style.transform;
    const originalTransformOrigin = element.style.transformOrigin;
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;

    // Apply styles for better PDF rendering
    element.style.transform = 'none';
    element.style.transformOrigin = 'unset';
    element.style.width = '21cm';
    element.style.height = '29.7cm'; // A4 size
    element.style.position = 'relative';
    element.style.zIndex = '9999';

    element.getBoundingClientRect();

    // Wait longer to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create canvas from the element with improved settings
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc, clonedElement) => {
        // Apply additional styling to the cloned element
        clonedElement.style.width = '21cm';
        clonedElement.style.height = '29.7cm';
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '0';
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.position = 'relative';
        clonedElement.style.pageBreakInside = 'avoid';
        clonedElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
        clonedElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
        clonedElement.style.textRendering = 'optimizeLegibility';

        // Special handling for Artisan template header background
        const headerElements = clonedElement.querySelectorAll('header');
        headerElements.forEach((header: Element) => {
          if (header instanceof HTMLElement) {
            // Ensure background color is preserved in the PDF
            const bgColor = header.style.backgroundColor;
            if (bgColor) {
              header.style.backgroundColor = bgColor;
              header.style.printColorAdjust = 'exact';
              header.style.setProperty('-webkit-print-color-adjust', 'exact');
            }
          }
        });

        // Special handling for profile pictures in Artisan template
        const profileImages = clonedElement.querySelectorAll('img.rounded-full');
        profileImages.forEach((img: Element) => {
          if (img instanceof HTMLImageElement) {
            // Make sure image is properly displayed with correct dimensions
            img.style.maxWidth = '100%';
            img.style.objectFit = 'cover';
            img.style.border = '2px solid white';
            img.crossOrigin = 'anonymous'; // Allow loading of cross-origin images
          }
        });

        // Set all children to use full space and improve rendering
        const children = clonedElement.querySelectorAll('*');
        children.forEach((child: Element) => {
          if (child instanceof HTMLElement) {
            child.style.boxSizing = 'border-box';
            child.style.setProperty('-webkit-font-smoothing', 'antialiased');
            child.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
            child.style.textRendering = 'optimizeLegibility';
          }
        });
      }
    });

    // Restore original properties
    element.style.transform = originalTransform;
    element.style.transformOrigin = originalTransformOrigin;
    element.style.width = originalWidth;
    element.style.height = originalHeight;
    element.style.position = originalPosition;
    element.style.zIndex = originalZIndex;

    element.getBoundingClientRect();

    // Create a download link from the canvas
    const pngDataUrl = canvas.toDataURL('image/png', 1.0);
    const pngBytes = Uint8Array.from(atob(pngDataUrl.split(',')[1]), c => c.charCodeAt(0));

    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(pngBytes);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const scaleX = pageWidth / pngImage.width;
    const scaleY = pageHeight / pngImage.height;
    const scaleToFill = Math.max(scaleX, scaleY);

    const drawWidth = pngImage.width * scaleToFill;
    const drawHeight = pngImage.height * scaleToFill;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(pngImage, { x, y, width: drawWidth, height: drawHeight });
    const pdfBytes = await pdfDoc.save();

    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(pdfUrl);

    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return false;
  }
}

/**
 * Generates a PDF from an HTML element and returns it as base64
 * @param element - The HTML element to export
 * @param options - Export options
 * @returns Promise<string|null> - Base64 encoded PDF or null if failed
 */
export async function getElementAsPdfBase64(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<string | null> {
  try {
    const {
      scale = 6
    } = options;

    // Temporarily reset transform for proper capture
    const originalTransform = element.style.transform;
    const originalTransformOrigin = element.style.transformOrigin;
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;

    // Apply styles for better PDF rendering
    element.style.transform = 'none';
    element.style.transformOrigin = 'unset';
    element.style.width = '21cm';
    element.style.height = '29.7cm'; // A4 size
    element.style.position = 'relative';
    element.style.zIndex = '9999';

    element.getBoundingClientRect();

    // Wait longer to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create canvas from the element with improved settings
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc, clonedElement) => {
        // Same styling as exportElementToPDF function
        clonedElement.style.width = '21cm';
        clonedElement.style.height = '29.7cm';
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '0';
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.position = 'relative';
        clonedElement.style.pageBreakInside = 'avoid';
        clonedElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
        clonedElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
        clonedElement.style.textRendering = 'optimizeLegibility';
      }
    });

    // Restore original properties
    element.style.transform = originalTransform;
    element.style.transformOrigin = originalTransformOrigin;
    element.style.width = originalWidth;
    element.style.height = originalHeight;
    element.style.position = originalPosition;
    element.style.zIndex = originalZIndex;

    // Return base64 encoded image
    const pngDataUrl = canvas.toDataURL('image/png', 1.0);
    const pngBytes = Uint8Array.from(atob(pngDataUrl.split(',')[1]), c => c.charCodeAt(0));

    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(pngBytes);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const scaleX = pageWidth / pngImage.width;
    const scaleY = pageHeight / pngImage.height;
    const scaleToFill = Math.max(scaleX, scaleY);

    const drawWidth = pngImage.width * scaleToFill;
    const drawHeight = pngImage.height * scaleToFill;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(pngImage, { x, y, width: drawWidth, height: drawHeight });
    const pdfBytes = await pdfDoc.save();
    return `data:application/pdf;base64,${bytesToBase64(new Uint8Array(pdfBytes))}`;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

/**
 * Exports a resume template to PDF with specific formatting for resume templates
 * @param element - The resume template element to export
 * @param options - Export options
 * @returns Promise<boolean> - Whether the export was successful
 */
export async function exportResumeTemplateToPDF(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  try {
    const exportOptions: PdfExportOptions = {
      filename: options.filename || 'resume.pdf',
      scale: options.scale || 6,
      format: options.format || 'a4',
      margin: 0,
      useFullPage: options.useFullPage !== undefined ? options.useFullPage : true,
      noHeaderMargin: options.noHeaderMargin !== undefined ? options.noHeaderMargin : true
    };

    // Prepare the element specifically for resume template export
    const originalClasses = element.className;
    const originalStyle = element.getAttribute('style') || '';

    // Add classes for better PDF rendering
    element.className = originalClasses + ' print:w-full print:max-w-none';
    element.setAttribute('style', originalStyle + '; width: 21cm; height: 29.7cm; margin: 0; padding: 0;');

    element.getBoundingClientRect();

    // Wait longer to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find header elements for special handling
    const headerElements = element.querySelectorAll('header, [data-pdf-header], .header');
    const headerContainers = Array.from(headerElements).map(header => header.parentElement).filter(Boolean);

    // Check if it's an Artisan template by looking for specific elements
    const isArtisanTemplate = element.querySelectorAll('img.rounded-full').length > 0;

    // Save original styles
    const originalHeaderStyles = new Map();
    const originalContainerStyles = new Map();
    const originalImageStyles = new Map();

    // Apply full-width styling to headers
    headerElements.forEach((header) => {
      if (header instanceof HTMLElement) {
        originalHeaderStyles.set(header, header.getAttribute('style') || '');
        header.style.width = '100%';
        header.style.maxWidth = 'none';
        header.style.margin = '0';
        header.style.padding = '0';

        // For Artisan template, ensure background color is preserved
        if (isArtisanTemplate) {
          if (header.style.backgroundColor) {
            header.style.printColorAdjust = 'exact';
            header.style.setProperty('-webkit-print-color-adjust', 'exact');
          }
        }
      }
    });

    // Apply no-padding to header containers
    headerContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        originalContainerStyles.set(container, container.getAttribute('style') || '');
        container.style.paddingLeft = '0';
        container.style.paddingRight = '0';
        container.style.marginLeft = '0';
        container.style.marginRight = '0';
      }
    });

    // Special handling for Artisan template profile images
    if (isArtisanTemplate) {
      const profileImages = element.querySelectorAll('img.rounded-full');
      profileImages.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          originalImageStyles.set(img, img.getAttribute('style') || '');
          img.style.maxWidth = '100%';
          img.style.objectFit = 'cover';
          img.style.border = '2px solid white';
          img.crossOrigin = 'anonymous';
        }
      });
    }

    // Fix text overlap by improving line height and spacing
    const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th, ul, ol');
    const originalTextStyles = new Map();

    textElements.forEach((textElement) => {
      if (textElement instanceof HTMLElement) {
        originalTextStyles.set(textElement, textElement.getAttribute('style') || '');

        // Prevent text overlap by ensuring proper line height
        if (!textElement.style.lineHeight || textElement.style.lineHeight === 'normal') {
          textElement.style.lineHeight = '1.6';
        }

        // Add slight margin between text elements to prevent overlap
        if (!textElement.style.marginBottom) {
          textElement.style.marginBottom = '0.3em';
        }

        // Ensure proper word wrapping
        if (!textElement.style.wordWrap) {
          textElement.style.wordWrap = 'break-word';
        }

        // Prevent text overflow
        if (!textElement.style.overflowWrap) {
          textElement.style.overflowWrap = 'break-word';
        }

        // Fix font rendering for sharper text
        textElement.style.textRendering = 'optimizeLegibility';
        textElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
        textElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');

        // Handle lists specifically
        if (textElement.tagName === 'UL' || textElement.tagName === 'OL') {
          if (!textElement.style.lineHeight || textElement.style.lineHeight === 'normal') {
            textElement.style.lineHeight = '1.6';
          }
          if (!textElement.style.marginBottom) {
            textElement.style.marginBottom = '0.5em';
          }
        }

        // Handle list items specifically
        if (textElement.tagName === 'LI') {
          if (!textElement.style.marginBottom) {
            textElement.style.marginBottom = '0.2em';
          }
        }
      }
    });

    // Export the element to PDF
    const result = await exportElementToPDF(element, exportOptions);

    // Restore original styles
    headerElements.forEach(header => {
      if (header instanceof HTMLElement) {
        const originalStyle = originalHeaderStyles.get(header);
        if (originalStyle !== undefined) {
          header.setAttribute('style', originalStyle);
        }
      }
    });

    headerContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        const originalStyle = originalContainerStyles.get(container);
        if (originalStyle !== undefined) {
          container.setAttribute('style', originalStyle);
        }
      }
    });

    // Restore original image styles for Artisan template
    if (isArtisanTemplate) {
      originalImageStyles.forEach((style, img) => {
        img.setAttribute('style', style);
      });
    }

    textElements.forEach(textElement => {
      if (textElement instanceof HTMLElement) {
        const originalStyle = originalTextStyles.get(textElement);
        if (originalStyle !== undefined) {
          textElement.setAttribute('style', originalStyle);
        }
      }
    });

    // Restore original properties
    element.className = originalClasses;
    element.setAttribute('style', originalStyle);

    element.getBoundingClientRect();

    return result;
  } catch (error) {
    console.error('Error exporting resume template to PDF:', error);
    throw error;
  }
}

/**
 * Exports an HTML element to PDF using Puppeteer API route
 * @param element - The HTML element to export
 * @param options - Export options
 * @returns Promise<boolean> - Whether the export was successful
 */
export async function exportElementToPDFWithPuppeteer(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  try {
    const {
      filename = 'document.pdf',
      format = 'a4',
      margin = 0
    } = options;

    const baseHref = window.location.origin;
    const templateClone = cloneTemplateForPuppeteer(element, baseHref);
    const htmlContent = templateClone.outerHTML;

    // Validate that we have content
    if (!htmlContent || htmlContent.trim().length === 0) {
      console.error('No HTML content to export');
      alert('No content to export. Please make sure your document has content.');
      return false;
    }

    // Create full HTML document using shared CSS
    const htmlDoc = buildPdfHtmlDocument('Document PDF Export', htmlContent, baseHref);

    // Validate the HTML document
    if (!htmlDoc || htmlDoc.trim().length === 0) {
      console.error('Generated HTML document is empty');
      alert('Failed to generate PDF content. Please try again.');
      return false;
    }

    // Send to Puppeteer API for PDF generation
    let apiResponse;
    try {
      // Add a class to the body element to help with styling
      document.body.classList.add('pdf-export-active');

      apiResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlDoc,
          options: {
            format,
            margin,
            printBackground: true,
            preferCSSPageSize: true
          },
          filename
        }),
      });

      // Remove the class after the request is complete
      document.body.classList.remove('pdf-export-active');
    } catch (fetchError) {
      // Ensure cleanup even if there's an error
      document.body.classList.remove('pdf-export-active');

      console.error('Network error during PDF generation:', fetchError);
      alert('Failed to generate PDF due to network error. Please check your connection and try again.');
      return false;
    }

    // Check if response is OK
    if (!apiResponse.ok) {
      let errorMessage = `PDF generation failed: ${apiResponse.status} ${apiResponse.statusText}`;

      try {
        // Try to get more detailed error from response
        const errorData = await apiResponse.json();
        if (errorData && errorData.details) {
          errorMessage = `PDF generation failed: ${errorData.details}`;
        } else if (errorData && errorData.error) {
          errorMessage = `PDF generation failed: ${errorData.error}`;
        }
      } catch {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await apiResponse.text();
          if (errorText) {
            errorMessage = `PDF generation failed: ${errorText}`;
          }
        } catch {
          // Ignore text parsing errors
        }
      }

      console.error(errorMessage);
      alert(`Failed to generate PDF. ${errorMessage}`);
      return false;
    }

    // Get the PDF as a blob
    let blob;
    try {
      blob = await apiResponse.blob();
      if (!blob || blob.size === 0) {
        console.error('Received empty PDF blob');
        alert('Failed to generate PDF: Empty document received. Please try again.');
        return false;
      }
    } catch (blobError) {
      console.error('Error getting PDF blob:', blobError);
      alert('Failed to process the generated PDF. Please try again.');
      return false;
    }

    // Create a download link and trigger download
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      a.style.display = 'none'; // Make it invisible
      document.body.appendChild(a);
      a.click();

      // Clean up immediately
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error during download:', downloadError);
      alert('Failed to download the PDF. Please try again.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error exporting PDF with Puppeteer:', error);
    alert('An unexpected error occurred while generating the PDF. Please try again.');
    return false;
  }
}

/**
 * Exports a resume template to PDF using Puppeteer for high quality output
 * @param element - The resume template element to export
 * @param options - Export options
 * @returns Promise<boolean> - Whether the export was successful
 */
export async function exportResumeTemplateToPDFWithPuppeteer(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  try {
    const exportOptions: PdfExportOptions = {
      filename: options.filename || 'resume.pdf',
      format: options.format || 'a4',
      margin: 0,
      useFullPage: options.useFullPage !== undefined ? options.useFullPage : true
    };

    // Prepare the element for PDF generation
    const originalClasses = element.className;
    const originalStyle = element.getAttribute('style') || '';

    // Add classes for better PDF rendering
    element.className = originalClasses + ' print:w-full print:max-w-none';
    element.setAttribute('style', originalStyle + '; width: 21cm; height: 29.7cm; margin: 0; padding: 0;');

    // Use Puppeteer-based export
    const result = await exportElementToPDFWithPuppeteer(element, exportOptions);

    // Restore original properties
    element.className = originalClasses;
    element.setAttribute('style', originalStyle);

    return result;
  } catch (error) {
    console.error('Error exporting resume template to PDF with Puppeteer:', error);
    return false;
  }
}

/**
 * Gets an HTML element as a base64 encoded PDF using Puppeteer
 * @param element - The HTML element to export
 * @param options - Export options
 * @returns Promise<string|null> - Base64 encoded PDF or null if failed
 */
export async function getElementAsPdfBase64WithPuppeteer(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<string | null> {
  try {
    const {
      format = 'a4',
      margin = 0
    } = options;

    const baseHref = window.location.origin;
    const templateClone = cloneTemplateForPuppeteer(element, baseHref);
    const htmlContent = templateClone.outerHTML;

    // Validate that we have content
    if (!htmlContent || htmlContent.trim().length === 0) {
      console.error('No HTML content to export');
      return null;
    }

    // Create full HTML document using shared CSS
    const htmlDoc = buildPdfHtmlDocument('Resume PDF Export', htmlContent, baseHref);

    // Validate the HTML document
    if (!htmlDoc || htmlDoc.trim().length === 0) {
      console.error('Generated HTML document is empty');
      return null;
    }

    // Send to Puppeteer API for PDF generation
    let apiResponse;
    try {
      // Add a class to the body element to help with styling
      document.body.classList.add('pdf-export-active');

      apiResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlDoc,
          options: {
            format,
            margin,
            printBackground: true,
            preferCSSPageSize: true,
            returnBase64: true
          }
        }),
      });

      // Remove the class after the request is complete
      document.body.classList.remove('pdf-export-active');
    } catch (fetchError) {
      // Ensure cleanup even if there's an error
      document.body.classList.remove('pdf-export-active');

      console.error('Network error during PDF generation:', fetchError);
      return null;
    }

    // Check if response is OK
    if (!apiResponse.ok) {
      let errorMessage = `PDF generation failed: ${apiResponse.status} ${apiResponse.statusText}`;

      try {
        // Try to get more detailed error from response
        const errorData = await apiResponse.json();
        if (errorData && errorData.details) {
          errorMessage = `PDF generation failed: ${errorData.details}`;
        } else if (errorData && errorData.error) {
          errorMessage = `PDF generation failed: ${errorData.error}`;
        }
      } catch {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await apiResponse.text();
          if (errorText) {
            errorMessage = `PDF generation failed: ${errorText}`;
          }
        } catch {
          // Ignore text parsing errors
        }
      }

      console.error(errorMessage);
      return null;
    }

    // Get the base64 PDF
    try {
      const result = await apiResponse.json();
      if (!result || !result.base64) {
        console.error('Invalid or missing base64 data in response');
        return null;
      }
      return result.base64;
    } catch (dataError) {
      console.error('Error processing PDF data:', dataError);
      return null;
    }
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    return null;
  }
}
