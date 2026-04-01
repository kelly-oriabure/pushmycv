import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, rateLimitKey } from '@/lib/rateLimit';
import { withAuth, createSupabaseAdminClient } from '@/lib/auth/unifiedAuth';

function sanitizeFileNamePart(value: string): string {
    return value.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '_').slice(0, 120);
}

async function handlePOST({ user, request }: { user: { id: string }; request: NextRequest }) {
    const rateLimitResult = applyRateLimit(rateLimitKey(request, `upload:${user.id}`, 'upload'), {
        windowMs: 60 * 1000,
        max: 5
    });

    if (!rateLimitResult.allowed) {
        return NextResponse.json({ error: 'Too many upload requests' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
    const baseName = sanitizeFileNamePart(file.name.replace(/\.[^/.]+$/, ''));
    const fileName = `${user.id}/${Date.now()}_${baseName}${ext ? `.${ext}` : ''}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const admin = createSupabaseAdminClient();
    const { error: uploadError } = await admin.storage
        .from('resumes')
        .upload(fileName, fileBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
        return NextResponse.json({ error: 'Failed to upload file', details: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from('resumes').getPublicUrl(fileName);

    return NextResponse.json({
        success: true,
        path: fileName,
        publicUrl: publicUrlData.publicUrl
    });
}

export const POST = withAuth(async ({ user, request }) => {
    return handlePOST({ user, request });
});
