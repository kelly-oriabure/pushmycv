import { NextResponse } from 'next/server';
import mockAnalyses from '@/data/mock-resume-analyses.json';

export async function GET() {
  try {
    // If needed, we could randomize or select specific entry here.
    return NextResponse.json({ analyses: mockAnalyses }, { status: 200 });
  } catch (e) {
    console.error('Error serving mock analyses:', e);
    return NextResponse.json({ error: 'Failed to load mock analyses' }, { status: 500 });
  }
}