import QRCode from 'qrcode';
import { supabaseAdmin } from './supabase';

interface GenerateQRResponse {
  standardUrl: string;
  transparentUrl: string;
}

/**
 * Generates standard and transparent QR codes for a given URL,
 * uploads them to the 'card-qr' Supabase storage bucket, and returns their public URLs.
 * @param slug The card slug, used as the folder name.
 * @param url The card URL or custom domain URL to encode.
 */
export async function generateAndUploadQRCodes(slug: string, url: string): Promise<GenerateQRResponse> {
  try {
    // 1. Generate standard QR code buffer (Black on White)
    const standardBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // 2. Generate transparent QR code buffer (Black on Transparent)
    const transparentBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#00000000', // Alpha channels for transparent background
      },
    });

    // 3. Upload to Supabase Storage bucket 'card-qr'
    const standardPath = `${slug}/standard.png`;
    const transparentPath = `${slug}/transparent.png`;

    // Ensure 'card-qr' bucket exists
    try {
      await supabaseAdmin.storage.createBucket('card-qr', { public: true });
    } catch (err) {
      // Ignore if it already exists
    }

    // Standard upload
    const { error: standardError } = await supabaseAdmin.storage
      .from('card-qr')
      .upload(standardPath, standardBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (standardError) {
      throw new Error(`Failed to upload standard QR: ${standardError.message}`);
    }

    // Transparent upload
    const { error: transparentError } = await supabaseAdmin.storage
      .from('card-qr')
      .upload(transparentPath, transparentBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (transparentError) {
      throw new Error(`Failed to upload transparent QR: ${transparentError.message}`);
    }

    // 4. Get Public URLs
    const { data: standardData } = supabaseAdmin.storage
      .from('card-qr')
      .getPublicUrl(standardPath);

    const { data: transparentData } = supabaseAdmin.storage
      .from('card-qr')
      .getPublicUrl(transparentPath);

    return {
      standardUrl: standardData.publicUrl,
      transparentUrl: transparentData.publicUrl,
    };
  } catch (error: any) {
    console.error('Error generating and uploading QR codes:', error);
    throw error;
  }
}
