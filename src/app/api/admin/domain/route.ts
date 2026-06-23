import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAndUploadQRCodes } from '@/lib/qr';
import { sendDomainActivationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { cardId, customDomain } = await request.json();

    if (!cardId || !customDomain) {
      return NextResponse.json({ error: 'Card ID and Custom Domain are required' }, { status: 400 });
    }

    // 1. Fetch card details to perform business validation
    const { data: card, error: fetchError } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Rule: Apply only to Luxury
    if (card.plan_id !== 'luxury') {
      return NextResponse.json({ error: 'Custom domains are only supported on the Luxury plan.' }, { status: 400 });
    }

    // Rule: Only allow if paid and published
    if (card.payment_status !== 'paid' || card.status !== 'published') {
      return NextResponse.json({ error: 'Custom domain can only be activated for published and paid cards.' }, { status: 400 });
    }

    // Rule: Validate domain string (no http, no https, no trailing slash, valid structure)
    const cleanDomain = customDomain.toLowerCase().trim();
    if (
      cleanDomain.startsWith('http://') ||
      cleanDomain.startsWith('https://') ||
      cleanDomain.includes('/') ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanDomain)
    ) {
      return NextResponse.json({ error: 'Tên miền không hợp lệ. Vui lòng không nhập http://, https://, hoặc ký tự gạch chéo /.' }, { status: 400 });
    }

    // 2. Generate new QR codes pointing to the custom domain URL
    const customDomainUrl = `https://${cleanDomain}`;
    const qrResult = await generateAndUploadQRCodes(card.slug, customDomainUrl);

    // 3. Update Custom Domain records in DB
    const activatedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('cards')
      .update({
        custom_domain: cleanDomain,
        domain_status: 'active',
        domain_activated_at: activatedAt,
        qr_code_url: qrResult.standardUrl, // Update to the new domain QR url
      })
      .eq('id', cardId);

    if (updateError) {
      console.error('Error updating domain info in DB:', updateError);
      return NextResponse.json({ error: 'Failed to update custom domain in database' }, { status: 500 });
    }

    // 4. Send domain activation confirmation email to customer
    try {
      await sendDomainActivationEmail({
        customerName: card.customer_name,
        customerEmail: card.customer_email,
        slug: card.slug,
        manageToken: card.manage_token,
        planId: card.plan_id,
        customDomain: cleanDomain,
        standardQrUrl: qrResult.standardUrl,
        transparentQrUrl: qrResult.transparentUrl,
      });
    } catch (emailErr) {
      console.error('Email dispatch failed for custom domain:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Custom domain activated successfully',
      domain: cleanDomain,
      qrUrls: qrResult,
    });
  } catch (error: any) {
    console.error('Custom domain activation error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
