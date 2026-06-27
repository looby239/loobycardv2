import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const ALLOWED_ASSET_TYPES = ['background', 'decorations', 'thumbnail'] as const;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const templateId = formData.get('templateId') as string | null;
    const assetType = formData.get('assetType') as typeof ALLOWED_ASSET_TYPES[number] | null;

    if (!file || !templateId || !assetType) {
      return NextResponse.json({ error: 'Missing file, templateId, or assetType' }, { status: 400 });
    }

    if (!ALLOWED_ASSET_TYPES.includes(assetType)) {
      return NextResponse.json({ error: 'Invalid assetType' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image assets are allowed' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `${templateId}/${assetType}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await supabaseAdmin.storage.createBucket('template-assets', { public: true });
    } catch {
      // Bucket already exists or Supabase disallows creation with current policy.
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from('template-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from('template-assets')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    if (assetType === 'thumbnail') {
      await supabaseAdmin
        .from('template_configs')
        .update({ thumbnail_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', templateId);
      try {
        await supabaseAdmin
          .from('templates')
          .update({ thumbnail_url: publicUrl })
          .eq('id', templateId);
      } catch {
        // templates mirror table may not be migrated yet.
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      assetType,
    });
  } catch (error: unknown) {
    console.error('POST /api/admin/templates/upload-asset error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
