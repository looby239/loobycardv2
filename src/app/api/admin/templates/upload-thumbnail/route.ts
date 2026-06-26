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
    const fileName = `${templateId}/thumbnail.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('template-thumbnails')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('template-thumbnails')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update template_configs
    const { error: updateError } = await supabaseAdmin
      .from('template_configs')
      .update({ thumbnail_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', templateId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('POST /api/admin/templates/upload-thumbnail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
