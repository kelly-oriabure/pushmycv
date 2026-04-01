import fs from 'fs';
import path from 'path';
import fetch, { FormData, File, Blob } from 'node-fetch';

type UploadResponse = {
  success?: boolean;
  isNew?: boolean;
  isDuplicate?: boolean;
  uploadId?: string;
  analysis?: any;
  status?: string;
  error?: string;
  message?: string;
};

type StatusResponse = {
  status?: string;
  overall_score?: number;
  categories?: Array<{ category: string; score: number }>;
  error_message?: string;
};

const NEXT_URL = process.env.NEXT_URL || 'http://localhost:3000';
const STATUS_ENDPOINT = `${NEXT_URL}/api/resume-score/status`;
const UPLOAD_ENDPOINT = `${NEXT_URL}/api/resume-score/upload`;

if (!process.env.TEST_SUPABASE_ACCESS_TOKEN) {
  console.error('Missing TEST_SUPABASE_ACCESS_TOKEN environment variable.');
  process.exit(1);
}

const accessToken = process.env.TEST_SUPABASE_ACCESS_TOKEN;
const samplePdfRelative = process.env.RESUME_TEST_PDF || 'hello.pdf';
const samplePdfPath = path.resolve(__dirname, '..', samplePdfRelative);

async function uploadResume(): Promise<UploadResponse> {
  if (!fs.existsSync(samplePdfPath)) {
    throw new Error(`Sample PDF not found at ${samplePdfPath}`);
  }

  const fileBuffer = fs.readFileSync(samplePdfPath);
  const formData = new FormData();

  const pdfBlob = new Blob([fileBuffer], { type: 'application/pdf' });
  const file = new File([pdfBlob], path.basename(samplePdfPath), {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  formData.append('file', file);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData as any,
  });

  const data = (await response.json()) as UploadResponse;
  if (!response.ok) {
    throw new Error(`Upload failed: ${data.error || response.statusText}`);
  }

  if (!data.uploadId) {
    throw new Error('Upload response missing uploadId');
  }

  console.log('[upload] response', data);
  return data;
}

async function checkStatus(uploadId: string, maxAttempts = 12, intervalMs = 5000): Promise<StatusResponse> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${STATUS_ENDPOINT}/${uploadId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json()) as StatusResponse & { error?: string };
    if (!response.ok) {
      throw new Error(`Status check failed: ${data.error || response.statusText}`);
    }

    console.log(`[status] attempt ${attempt}:`, data.status, data.overall_score);

    if (data.status === 'completed' && typeof data.overall_score === 'number' && data.overall_score > 0) {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error(`Analysis failed: ${data.error_message || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Analysis did not complete within time limit');
}

async function main() {
  console.log('Starting resume-score end-to-end test');

  try {
    const uploadResult = await uploadResume();
    const uploadId = uploadResult.analysis?.upload_id || uploadResult.uploadId;

    if (!uploadId) {
      throw new Error('No upload id returned from API');
    }

    const status = await checkStatus(uploadId);

    console.log('\n=== Resume Analysis Result ===');
    console.log('Status:', status.status);
    console.log('Overall Score:', status.overall_score);
    console.log('Categories:', status.categories);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
