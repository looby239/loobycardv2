import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

export async function GET(request: Request) {
  try {
    // Auth Check
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      // Also allow verification via query parameter as fallback for testing
      const { searchParams } = new URL(request.url);
      const secretParam = searchParams.get('secret');
      if (secretParam !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();

    // --- Task 1: Clean up unpaid drafts older than 24 hours ---
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: draftsToDelete, error: draftsFetchError } = await supabaseAdmin
      .from('cards')
      .select('id, slug')
      .eq('status', 'draft')
      .eq('payment_status', 'unpaid')
      .lt('created_at', cutoffDate.toISOString());

    if (draftsFetchError) {
      console.error('Error fetching expired draft cards:', draftsFetchError);
      return NextResponse.json({ error: 'Failed to query drafts' }, { status: 500 });
    }

    let deletedDraftCount = 0;
    if (draftsToDelete && draftsToDelete.length > 0) {
      const draftIds = draftsToDelete.map((c: any) => c.id);

      // Delete storage files
      for (const card of draftsToDelete) {
        await deleteFolder('card-images', card.id);
        await deleteFolder('card-music', card.id);
        await deleteFolder('card-qr', card.id);
        await deleteFolder('card-qr', card.slug);
      }

      // Explicitly delete from related tables
      await supabaseAdmin.from('card_images').delete().in('card_id', draftIds);
      await supabaseAdmin.from('rsvp_responses').delete().in('card_id', draftIds);
      await supabaseAdmin.from('guest_messages').delete().in('card_id', draftIds);

      // Finally delete the card records
      const { error: dbDeleteError } = await supabaseAdmin
        .from('cards')
        .delete()
        .in('id', draftIds);

      if (dbDeleteError) {
        console.error('Error deleting draft cards from DB:', dbDeleteError);
        return NextResponse.json({ error: 'Failed to delete card records' }, { status: 500 });
      }
      deletedDraftCount = draftsToDelete.length;
    }

    // --- Task 2: Expire published cards that have passed their expires_at ---
    const { data: expiredCards, error: expireUpdateError } = await supabaseAdmin
      .from('cards')
      .update({ status: 'expired' })
      .eq('status', 'published')
      .eq('payment_status', 'paid')
      .lt('expires_at', now.toISOString())
      .select('id');

    if (expireUpdateError) {
      console.error('Error expiring cards in DB:', expireUpdateError);
      return NextResponse.json({ error: 'Failed to update expired cards' }, { status: 500 });
    }

    const expiredCount = expiredCards ? expiredCards.length : 0;

    // --- Task 3: Clean up page_views older than 12 months ---
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const { error: viewsCleanupError, count: deletedViewsCount } = await supabaseAdmin
      .from('page_views')
      .delete({ count: 'exact' })
      .lt('created_at', twelveMonthsAgo.toISOString());

    if (viewsCleanupError) {
      console.error('Error cleaning up old page_views:', viewsCleanupError);
      // Non-fatal — continue and report
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      deletedDrafts: deletedDraftCount,
      expiredCards: expiredCount,
      deletedOldPageViews: deletedViewsCount || 0,
    });
  } catch (error: any) {
    console.error('Cleanup Cron Job error:', error);
    return NextResponse.json({ error: error.message || 'Cron execution failed' }, { status: 500 });
  }
}
