import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'docs', 'openapi.yaml');
    const content = await readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/yaml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'OPENAPI_NOT_FOUND', message: 'OpenAPI spec not found', details: e?.message }
    }, { status: 404 });
  }
}
