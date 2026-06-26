import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function deleteFolder(bucket: string, folderName: string) {
  try {
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucket)
      .list(folderName);

    if (listError) {
      console.error(`Error listing files in bucket ${bucket} folder ${folderName}:`, listError);
      return;
    }

    if (!files || files.length === 0) return;

    const filesToDelete = files.map((file: any) => `${folderName}/${file.name}`);
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucket)
      .remove(filesToDelete);

    if (deleteError) {
      console.error(`Error removing files from bucket ${bucket}:`, deleteError);
    }
  } catch (err) {
    console.error(`Exception deleting folder ${folderName} from bucket ${bucket}:`, err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, action, editData } = body;

    if (!cardId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Fetch current card
    const { data: card, error: fetchError } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'renew') {
      // Base date is now or existing expires_at (whichever is in the future)
      let baseDate = now;
      if (card.expires_at) {
        const currentExpires = new Date(card.expires_at);
        if (currentExpires > now) {
          baseDate = currentExpires;
        }
      }

      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

      const { error: updateError } = await supabaseAdmin
        .from('cards')
        .update({
          expires_at: newExpiresAt.toISOString(),
          status: 'published', // set back to published if it was expired
          archived_at: null, // clear archived if it was archived
          deleted_at: null, // clear deleted if it was deleted
        })
        .eq('id', cardId);

      if (updateError) {
        throw new Error(`Failed to renew card: ${updateError.message}`);
      }

      return NextResponse.json({ success: true, message: 'Card renewed successfully for 1 month' });
    }

    if (action === 'archive') {
      const { error: updateError } = await supabaseAdmin
        .from('cards')
        .update({
          status: 'archived',
          archived_at: now.toISOString(),
        })
        .eq('id', cardId);

      if (updateError) {
        throw new Error(`Failed to archive card: ${updateError.message}`);
      }

      return NextResponse.json({ success: true, message: 'Card archived successfully' });
    }

    if (action === 'permanent_delete') {
      // 1. Delete storage files
      await deleteFolder('card-images', card.id);
      await deleteFolder('card-music', card.id);
      await deleteFolder('card-qr', card.id);
      await deleteFolder('card-qr', card.slug);

      // 2. Explicitly delete relations
      await supabaseAdmin.from('card_images').delete().eq('card_id', card.id);
      await supabaseAdmin.from('rsvp_responses').delete().eq('card_id', card.id);
      await supabaseAdmin.from('guest_messages').delete().eq('card_id', card.id);

      // 3. Delete card record
      const { error: dbDeleteError } = await supabaseAdmin
        .from('cards')
        .delete()
        .eq('id', card.id);

      if (dbDeleteError) {
        throw new Error(`Failed to delete card record: ${dbDeleteError.message}`);
      }

      return NextResponse.json({ success: true, message: 'Card and all associated data permanently deleted' });
    }

    // Custom fallback action for soft delete just in case
    if (action === 'soft_delete') {
      const { error: updateError } = await supabaseAdmin
        .from('cards')
        .update({
          deleted_at: now.toISOString(),
        })
        .eq('id', cardId);

      if (updateError) {
        throw new Error(`Failed to soft-delete card: ${updateError.message}`);
      }

      return NextResponse.json({ success: true, message: 'Card soft-deleted successfully' });
    }

    if (action === 'edit') {
      if (!editData) {
        return NextResponse.json({ error: 'Missing edit data' }, { status: 400 });
      }

      // Check slug validation if slug is modified
      if (editData.slug && editData.slug !== card.slug) {
        if (!/^[a-z0-9-]+$/.test(editData.slug)) {
          return NextResponse.json({ error: 'Slug format invalid' }, { status: 400 });
        }
        const { data: existingSlugs, error: slugCheckError } = await supabaseAdmin
          .from('cards')
          .select('id')
          .eq('slug', editData.slug)
          .neq('id', cardId);

        if (slugCheckError) {
          throw new Error('Failed to verify slug uniqueness');
        }
        if (existingSlugs && existingSlugs.length > 0) {
          return NextResponse.json({ error: 'Slug matches an existing card' }, { status: 400 });
        }
      }

      // Prepare fields to update
      const updateData: any = {};
      const allowedFields = [
        'customer_name', 'customer_email', 'customer_phone',
        'bride_name', 'groom_name',
        'bride_father_name', 'bride_mother_name',
        'groom_father_name', 'groom_mother_name',
        'bride_address', 'groom_address',
        'reception_time', 'ceremony_time',
        'venue_name', 'venue_address', 'map_url',
        'invitation_text', 'quote_text', 'thank_you_text',
        'slug', 'custom_domain', 'domain_status',
        'groom_role', 'bride_role',
        'groom_bank_name', 'groom_bank_account', 'groom_bank_holder',
        'bride_bank_name', 'bride_bank_account', 'bride_bank_holder',
        'dress_code', 'payment_status', 'status',
        'cover_image_url', 'music_url', 'has_schedule', 'wedding_schedule'
      ];

      for (const field of allowedFields) {
        if (editData[field] !== undefined) {
          updateData[field] = editData[field];
        }
      }

      // Special handling for event_date formatting
      if (editData.event_date) {
        const parsedYear = new Date(editData.event_date).getFullYear();
        if (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > 9999) {
          return NextResponse.json({ error: 'Năm tổ chức không hợp lệ (phải là năm có 4 chữ số)' }, { status: 400 });
        }
        updateData.event_date = new Date(editData.event_date).toISOString();
      }

      const { error: updateError } = await supabaseAdmin
        .from('cards')
        .update(updateData)
        .eq('id', cardId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update Album Images
      if (editData.album_images !== undefined && Array.isArray(editData.album_images)) {
        // First clean existing album images for this card ID
        const { error: deleteImagesError } = await supabaseAdmin
          .from('card_images')
          .delete()
          .eq('card_id', cardId);

        if (deleteImagesError) {
          console.error('Error cleaning old images:', deleteImagesError);
        }

        // Bulk insert new album images
        if (editData.album_images.length > 0) {
          const imageRecords = editData.album_images.map((imgUrl: string, index: number) => ({
            card_id: cardId,
            image_url: imgUrl,
            sort_order: index,
          }));

          const { error: insertImagesError } = await supabaseAdmin
            .from('card_images')
            .insert(imageRecords);

          if (insertImagesError) {
            console.error('Error inserting new images:', insertImagesError);
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Cập nhật thiệp cưới thành công' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin action handler error:', error);
    return NextResponse.json({ error: error.message || 'Server error during card action' }, { status: 500 });
  }
}
