import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string; // 'card-images' or 'card-music'
    const folder = formData.get('folder') as string; // e.g. card UUID

    if (!file || !bucket || !folder) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate bucket
    if (!['card-images', 'card-music'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    // Convert file to ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate clean filename
    const fileExtension = file.name.split('.').pop() || '';
    const cleanFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
    const filePath = `${folder}/${cleanFilename}`;

    // Ensure bucket exists
    try {
      await supabaseAdmin.storage.createBucket(bucket, { public: true });
    } catch (err) {
      // Ignore error if bucket already exists
    }

    // Upload using Supabase Admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: error.message || 'Server error during upload' }, { status: 500 });
  }
}
