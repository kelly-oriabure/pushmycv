import DOMPurify from 'dompurify';

function decodeHtmlEntities(input: string): string {
    if (!input) return '';
    try {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = input;
            return textarea.value;
        }
    } catch { }
    return input
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

export function sanitizeRichText(html: string): string {
    if (!html || typeof html !== 'string') return '';

    // Decode entities so strings like "&lt;p&gt;...&lt;/p&gt;" render as HTML
    const decoded = decodeHtmlEntities(html);

    // Basic sanitize
    let sanitized = DOMPurify.sanitize(decoded, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'a'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style']
    });

    // Remove empty headings and empty paragraphs/spans (like <h3><br></h3>)
    sanitized = sanitized
        .replace(/<h[1-6][^>]*>\s*(<br\s*\/>|&nbsp;|\s|)*<\/h[1-6]>/gi, '')
        .replace(/<(p|span|div)[^>]*>\s*(<br\s*\/>|&nbsp;|\s)*<\/(p|span|div)>/gi, '');

    // If text contains no tags after sanitize, convert newlines to paragraphs
    if (!/[<][a-z][^>]*>/i.test(sanitized)) {
        sanitized = sanitized
            .split(/\n{2,}/)
            .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    return sanitized.trim();
}


