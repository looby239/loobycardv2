import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAndUploadQRCodes } from '@/lib/qr';
import { sendPublishEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // 1. Fetch card details to get slug, customer info, etc.
    const { data: card, error: fetchError } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // 2. Determine card site URL
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loobycard.com';
    if (siteUrl.includes('loobycard.com')) siteUrl = 'https://loobycard.com';
    const cardUrl = `${siteUrl}/${card.slug}`;

    // 3. Generate QR Codes (standard & transparent) and upload to Storage
    const qrResult = await generateAndUploadQRCodes(card.slug, cardUrl);

    // 4. Update card status in database
    const publishedAt = new Date();
    const expiresAt = new Date(publishedAt);
    
    if (card.plan_id === 'basic') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (card.plan_id === 'premium') {
      expiresAt.setMonth(expiresAt.getMonth() + 3);
    } else if (card.plan_id === 'luxury') {
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { error: updateError } = await supabaseAdmin
      .from('cards')
      .update({
        payment_status: 'paid',
        status: 'published',
        published_at: publishedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        qr_code_url: qrResult.standardUrl, // save standard QR URL
      })
      .eq('id', cardId);

    if (updateError) {
      console.error('Error updating card status in DB:', updateError);
      return NextResponse.json({ error: 'Failed to update database status' }, { status: 500 });
    }

    // 5. Send confirmation email to customer
    try {
      await sendPublishEmail({
        customerName: card.customer_name,
        customerEmail: card.customer_email,
        slug: card.slug,
        manageToken: card.manage_token,
        planId: card.plan_id,
        standardQrUrl: qrResult.standardUrl,
        transparentQrUrl: qrResult.transparentUrl,
        publishedAt: publishedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
    } catch (emailErr) {
      // Log email error but don't fail the whole approval process
      console.error('Nodemailer email dispatch failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Card approved and published successfully',
      qrUrls: qrResult,
    });
  } catch (error: any) {
    console.error('Admin approval handler error:', error);
    return NextResponse.json({ error: error.message || 'Server error during approval' }, { status: 500 });
  }
}
