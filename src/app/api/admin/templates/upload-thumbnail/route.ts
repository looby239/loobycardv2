import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const templateId = formData.get('templateId') as string | null;

    if (!file || !templateId) {
      return NextResponse.json({ error: 'Missing file or templateId' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${templateId}/thumbnail-${Date.now()}.${safeExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure bucket exists
    try {
      await supabaseAdmin.storage.createBucket('template-thumbnails', { public: true });
    } catch {
      // Ignore error if bucket already exists
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('template-thumbnails')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('template-thumbnails')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    const updatedAt = new Date().toISOString();

    // Update template_configs
    const { error: updateError } = await supabaseAdmin
      .from('template_configs')
      .update({ thumbnail_url: publicUrl, updated_at: updatedAt })
      .eq('id', templateId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, url: publicUrl, updated_at: updatedAt });
  } catch (error: unknown) {
    console.error('POST /api/admin/templates/upload-thumbnail error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
