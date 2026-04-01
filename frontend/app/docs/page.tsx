"use client";

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    SwaggerUIBundle?: any;
    SwaggerUIStandalonePreset?: any;
  }
}

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);
    // Load Swagger UI bundle script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.async = true;
    script.onload = () => {
      if (window.SwaggerUIBundle && containerRef.current) {
        window.SwaggerUIBundle({
          url: '/api/openapi',
          domNode: containerRef.current,
          deepLinking: true,
          docExpansion: 'list',
          presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          tryItOutEnabled: true,
          supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return <div ref={containerRef} style={{ height: '100vh' }} />;
}
