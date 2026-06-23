import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import ManageDashboard from './ManageDashboard';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ManagePage({ params }: PageProps) {
  const { token } = await params;

  // Retrieve card using the manage_token
  const { data: rawCard, error: cardError } = await supabaseAdmin
    .from('cards')
    .select('id, slug, customer_name, bride_name, groom_name, plan_id, pricing_plans(rsvp_limit)')
    .eq('manage_token', token)
    .maybeSingle();

  if (cardError) {
    console.error('Error fetching card for management:', cardError);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow max-w-md w-full text-center">
          <p className="text-red-500 font-semibold">Lỗi hệ thống khi tải trang quản lý.</p>
        </div>
      </div>
    );
  }

  if (!rawCard) {
    return notFound();
  }

  const card = {
    id: rawCard.id,
    slug: rawCard.slug,
    customer_name: rawCard.customer_name,
    bride_name: rawCard.bride_name,
    groom_name: rawCard.groom_name,
    plan_id: rawCard.plan_id,
    rsvp_limit: (rawCard.pricing_plans as any)?.rsvp_limit ?? -1,
  };

  // Fetch RSVPs for this card
  const { data: rsvps, error: rsvpError } = await supabaseAdmin
    .from('rsvp_responses')
    .select('*')
    .eq('card_id', card.id)
    .order('created_at', { ascending: false });

  // Fetch guestbook messages for this card
  const { data: wishes, error: wishesError } = await supabaseAdmin
    .from('guest_messages')
    .select('*')
    .eq('card_id', card.id)
    .order('created_at', { ascending: false });

  if (rsvpError || wishesError) {
    console.error('Error fetching RSVP data:', { rsvpError, wishesError });
  }

  return (
    <ManageDashboard
      card={card}
      initialRsvps={rsvps || []}
      initialWishes={wishes || []}
      manageToken={token}
    />
  );
}
