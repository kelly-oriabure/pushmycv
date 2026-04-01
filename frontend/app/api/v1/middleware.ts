import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://pushmycv.com',
  'https://api.pushmycv.com',
  'http://localhost:3000',
  'http://api.localhost:3000',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowed = origin && allowedOrigins.includes(origin);

  // Handle pre-flight OPTIONS
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'content-type, authorization');
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    return response;
  }

  // For actual requests, add CORS headers
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
