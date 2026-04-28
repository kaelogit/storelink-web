'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatPartnerMenuView, type SheetPartner } from '@/components/chat/ChatPartnerMenuView';
import { createBrowserClient } from '@/lib/supabase';

type ChatRow = {
  id: string;
  buyer_id?: string | null;
  seller_id?: string | null;
  buyer?: SheetPartner | null;
  seller?: SheetPartner | null;
};

function safeAppReturnTo(raw: string | null, fallback: string) {
  if (!raw) return fallback;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  if (!decoded.startsWith('/app/') || decoded.startsWith('//')) return fallback;
  return decoded;
}

export default function ChatPartnerMenuPage() {
  const params = useParams<{ chatId: string }>();
  const chatId = String(params?.chatId || '');
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const fallbackReturn = `/app/chat/${encodeURIComponent(chatId)}`;
  const returnTo = safeAppReturnTo(searchParams.get('returnTo'), fallbackReturn);
  const isRequest = searchParams.get('isRequest') === '1';

  const [userId, setUserId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    setErrorText(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        router.replace('/auth/login');
        return;
      }
      const { data: row, error } = await supabase
        .from('chats')
        .select(
          'id, buyer_id, seller_id, buyer:buyer_id(id,display_name,slug,logo_url,is_seller,phone_number,subscription_plan), seller:seller_id(id,display_name,slug,logo_url,is_seller,phone_number,subscription_plan)',
        )
        .eq('id', chatId)
        .maybeSingle();
      if (error) throw error;
      setChat((row as ChatRow) || null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not load chat.';
      setErrorText(msg);
      setChat(null);
    } finally {
      setLoading(false);
    }
  }, [chatId, router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const partner = useMemo(() => {
    if (!chat || !userId) return null;
    return chat.buyer_id === userId ? chat.seller : chat.buyer;
  }, [chat, userId]);

  if (loading) {
    return <p className="py-16 text-center text-sm text-(--muted)">Loading…</p>;
  }

  if (errorText || !partner?.id) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-(--background) px-4 text-center">
        <p className="text-sm font-semibold text-(--foreground)">{errorText || 'Chat not found'}</p>
        <button
          type="button"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          onClick={() => router.replace(returnTo)}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <ChatPartnerMenuView
      chatId={chatId}
      returnTo={returnTo}
      currentUserId={userId}
      partner={{
        id: partner.id,
        slug: partner.slug,
        display_name: partner.display_name,
        logo_url: partner.logo_url,
        phone_number: partner.phone_number,
        is_seller: partner.is_seller,
        subscription_plan: partner.subscription_plan,
      }}
      isRequest={isRequest}
      onMutedChange={() => router.refresh()}
    />
  );
}
