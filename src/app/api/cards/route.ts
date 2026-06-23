import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendDemoEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const cardData = await request.json();

    const {
      id,
      template_id,
      plan_id,
      amount,
      slug,
      customer_name,
      customer_email,
      customer_phone,
      bride_name,
      groom_name,
      bride_father_name,
      bride_mother_name,
      groom_father_name,
      groom_mother_name,
      bride_address,
      groom_address,
      event_date,
      reception_time,
      ceremony_time,
      venue_name,
      venue_address,
      map_url,
      invitation_text,
      quote_text,
      thank_you_text,
      cover_image_url,
      music_url,
      manage_token,
      album_images, // Array of strings (image urls)

      // Custom fields
      groom_role,
      bride_role,
      groom_bank_name,
      groom_bank_account,
      groom_bank_holder,
      bride_bank_name,
      bride_bank_account,
      bride_bank_holder,
      dress_code,
    } = cardData;

    // 1. Perform Slug Validation
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug format invalid' }, { status: 400 });
    }

    // Double check slug uniqueness (excluding current card ID)
    const { data: existingSlugs, error: slugCheckError } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('slug', slug)
      .neq('id', id);

    if (slugCheckError) {
      return NextResponse.json({ error: 'Failed to verify slug' }, { status: 500 });
    }
    if (existingSlugs && existingSlugs.length > 0) {
      return NextResponse.json({ error: 'Slug matches an existing card' }, { status: 400 });
    }

    // Validate event date year range to prevent Postgres overflow/parsing issues
    if (event_date) {
      const parsedYear = new Date(event_date).getFullYear();
      if (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > 9999) {
        return NextResponse.json({ error: 'Năm tổ chức không hợp lệ (phải là năm có 4 chữ số)' }, { status: 400 });
      }
    }

    // 2. Prepare card insertion object
    const cardRecord = {
      id,
      template_id,
      plan_id,
      amount,
      slug,
      customer_name,
      customer_email,
      customer_phone,
      bride_name,
      groom_name,
      bride_father_name: bride_father_name || null,
      bride_mother_name: bride_mother_name || null,
      groom_father_name: groom_father_name || null,
      groom_mother_name: groom_mother_name || null,
      bride_address: bride_address || null,
      groom_address: groom_address || null,
      event_date: event_date ? new Date(event_date).toISOString() : null,
      reception_time,
      ceremony_time,
      venue_name,
      venue_address,
      map_url: map_url || null,
      invitation_text,
      quote_text: quote_text || null,
      thank_you_text: thank_you_text || null,
      cover_image_url,
      music_url: music_url || null,
      manage_token,
      status: 'draft', // Submitting places it in draft (demo) status

      // Custom fields mappings
      groom_role: groom_role || 'Chú rể',
      bride_role: bride_role || 'Cô dâu',
      groom_bank_name: groom_bank_name || null,
      groom_bank_account: groom_bank_account || null,
      groom_bank_holder: groom_bank_holder || null,
      bride_bank_name: bride_bank_name || null,
      bride_bank_account: bride_bank_account || null,
      bride_bank_holder: bride_bank_holder || null,
      dress_code: dress_code || null,
    };

    // 3. Upsert Card in DB
    const { error: cardUpsertError } = await supabaseAdmin
      .from('cards')
      .upsert(cardRecord, { onConflict: 'id' });

    if (cardUpsertError) {
      console.error('Card upsert error:', cardUpsertError);
      return NextResponse.json({ error: `Save failed: ${cardUpsertError.message}` }, { status: 500 });
    }

    // 4. Update Album Images
    if (album_images && Array.isArray(album_images)) {
      // First clean existing album images for this card ID
      const { error: deleteImagesError } = await supabaseAdmin
        .from('card_images')
        .delete()
        .eq('card_id', id);

      if (deleteImagesError) {
        console.error('Error cleaning old images:', deleteImagesError);
      }

      // Bulk insert new album images
      if (album_images.length > 0) {
        const imageRecords = album_images.map((imgUrl, index) => ({
          card_id: id,
          image_url: imgUrl,
          sort_order: index,
        }));

        const { error: insertImagesError } = await supabaseAdmin
          .from('card_images')
          .insert(imageRecords);

        if (insertImagesError) {
          console.error('Error saving album images:', insertImagesError);
        }
      }
    }

    // Send confirmation email after card created (which is the demo creation)
    try {
      await sendDemoEmail({
        customerName: customer_name,
        customerEmail: customer_email,
        slug: slug,
        planId: plan_id,
      });
    } catch (emailErr) {
      console.error('Failed to send demo email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      cardId: id,
      slug,
      manageToken: manage_token,
    });
  } catch (error: any) {
    console.error('Card save API handler error:', error);
    return NextResponse.json({ error: error.message || 'Server error saving card' }, { status: 500 });
  }
}
