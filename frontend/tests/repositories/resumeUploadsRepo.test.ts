import { createResumeUpload, updateResumeUpload } from '../../app/lib/repositories/resumeUploadsRepo';

// Minimal SupabaseClient mock shape used by the repo
function makeSupabaseMock() {
  const state: any = { inserted: null, updated: null, shouldError: false, errorMessage: 'db error', code: 'P0001' };

  const single = jest.fn().mockImplementation(() => {
    if (state.shouldError) {
      return { data: null, error: { message: state.errorMessage, code: state.code } };
    }
    return { data: { id: 'new-id-123' }, error: null };
  });

  const select = jest.fn().mockReturnValue({ single });

  const insert = jest.fn().mockImplementation((payload) => {
    state.inserted = payload;
    return { select };
  });

  const update = jest.fn().mockImplementation((payload) => {
    state.updated = payload;
    return { eq: jest.fn().mockReturnValue({ error: state.shouldError ? { message: state.errorMessage } : null }) };
  });

  const from = jest.fn().mockReturnValue({ insert, update });

  return { client: { from } as any, state };
}

describe('resumeUploadsRepo', () => {
  test('createResumeUpload - success', async () => {
    const { client, state } = makeSupabaseMock();
    state.shouldError = false;

    const { data, error } = await createResumeUpload(client, {
      user_id: 'user-1',
      file_name: 'resume.pdf',
      file_type: 'application/pdf',
      file_size: 12345,
      resume_url: 'https://example.com/resume.png',
      pdf_url: 'https://example.com/resume.pdf',
      content_hash: 'abc',
      composite_hash: 'abc|def',
      extracted_text: 'Hello world',
    });

    expect(error).toBeUndefined();
    expect(data?.id).toBe('new-id-123');
    expect(state.inserted).toBeTruthy();
  });

  test('createResumeUpload - failure', async () => {
    const { client, state } = makeSupabaseMock();
    state.shouldError = true;
    state.errorMessage = 'constraint violation';

    const { data, error, code } = await createResumeUpload(client, {
      user_id: 'user-1',
      file_name: 'resume.pdf',
      file_type: 'application/pdf',
      file_size: 12345,
      resume_url: 'https://example.com/resume.png',
      content_hash: null,
      composite_hash: null,
      extracted_text: '',
    } as any);

    expect(data).toBeUndefined();
    expect(error).toBe('constraint violation');
    expect(code).toBe('P0001');
  });

  test('updateResumeUpload - success', async () => {
    const { client, state } = makeSupabaseMock();
    state.shouldError = false;

    const result = await updateResumeUpload(client, 'existing-id', {
      file_name: 'resume_v2.pdf',
      file_type: 'application/pdf',
      file_size: 20000,
      resume_url: 'https://example.com/resume2.png',
      pdf_url: 'https://example.com/resume_v2.pdf',
      content_hash: 'def',
      composite_hash: 'ghi',
      extracted_text: 'Updated',
    });

    expect(result.success).toBe(true);
    expect(state.updated).toBeTruthy();
  });

  test('updateResumeUpload - failure', async () => {
    const { client, state } = makeSupabaseMock();
    state.shouldError = true;
    state.errorMessage = 'update failed';

    const result = await updateResumeUpload(client, 'existing-id', {
      file_name: 'resume_v2.pdf',
      file_type: 'application/pdf',
      file_size: 20000,
      resume_url: 'https://example.com/resume2.png',
      content_hash: null,
      composite_hash: null,
      extracted_text: '',
    } as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('update failed');
  });
});
