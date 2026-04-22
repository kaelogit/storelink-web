'use client';

import { useEffect, useState } from 'react';
import WebProductCard from '@/app/explore/WebProductCard';
import { createBrowserClient } from '@/lib/supabase';
import HomeCommentsSheet from './HomeCommentsSheet';
import HomeLikesSheet from './HomeLikesSheet';
import { enqueueRankingEventWeb } from '@/lib/rankingEventsWeb';

export default function HomeFeedCard({
  item,
  onAddToCart,
}: {
  item: any;
  onAddToCart: () => void;
}) {
  const [likesOpen, setLikesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [current, setCurrent] = useState(item);
  const [pendingLike, setPendingLike] = useState(false);
  const [pendingWishlist, setPendingWishlist] = useState(false);
  const supabase = createBrowserClient();
  useEffect(() => {
    setCurrent(item);
  }, [item]);

  const handleToggleLike = async (target: any) => {
    if (pendingLike) return;
    setPendingLike(true);
    const wasLiked = Boolean(target?.is_liked);
    const prev = current;
    setCurrent((prev: any) => ({
      ...prev,
      is_liked: !wasLiked,
      likes_count: Math.max(0, Number(prev?.likes_count || 0) + (wasLiked ? -1 : 1)),
    }));
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      if (target?.type === 'service' || target?.service_listing_id) {
        if (wasLiked) {
          await supabase.from('service_likes').delete().eq('service_listing_id', target.id).eq('user_id', userId);
        } else {
          await supabase.from('service_likes').insert({ service_listing_id: target.id, user_id: userId });
        }
      } else {
        await supabase.rpc('toggle_product_like', { p_product_id: target.id, p_user_id: userId });
      }
      enqueueRankingEventWeb({
        surface: 'home',
        eventName: wasLiked ? 'hide' : 'like',
        itemId: String(target.id),
        itemType: target?.type === 'service' || target?.service_listing_id ? 'service' : 'product',
        sellerId: target?.seller?.id || null,
      });
    } catch {
      setCurrent(prev);
    } finally {
      setPendingLike(false);
    }
  };

  const handleToggleWishlist = async (target: any) => {
    if (pendingWishlist) return;
    setPendingWishlist(true);
    const wasWishlisted = Boolean(target?.is_wishlisted);
    const prev = current;
    setCurrent((prev: any) => ({
      ...prev,
      is_wishlisted: !wasWishlisted,
      wishlist_count: Math.max(0, Number(prev?.wishlist_count || 0) + (wasWishlisted ? -1 : 1)),
    }));
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      if (target?.type === 'service' || target?.service_listing_id) {
        const { data } = await supabase
          .from('service_wishlist')
          .select('id')
          .eq('user_id', userId)
          .eq('service_listing_id', target.id)
          .maybeSingle();
        if (data?.id) {
          await supabase.from('service_wishlist').delete().eq('id', data.id);
        } else {
          await supabase.from('service_wishlist').insert({ user_id: userId, service_listing_id: target.id });
        }
      } else {
        const { data } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', target.id)
          .maybeSingle();
        if (data?.id) {
          await supabase.from('wishlist').delete().eq('id', data.id);
        } else {
          await supabase.from('wishlist').insert({ user_id: userId, product_id: target.id });
        }
      }
      enqueueRankingEventWeb({
        surface: 'home',
        eventName: 'save',
        itemId: String(target.id),
        itemType: target?.type === 'service' || target?.service_listing_id ? 'service' : 'product',
        sellerId: target?.seller?.id || null,
        metadata: { saved: !wasWishlisted },
      });
    } catch {
      setCurrent(prev);
    } finally {
      setPendingWishlist(false);
    }
  };
  const handleShare = async (target: any) => {
    const href =
      target?.type === 'service' || target?.service_listing_id
        ? `${window.location.origin}/s/${target?.seller?.slug}/service/${target?.id}`
        : `${window.location.origin}/p/${target?.slug || target?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: target?.name || 'StoreLink item', url: href });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href);
      }
    } catch {
      // user cancelled share
    }
  };

  return (
    <>
      <WebProductCard
        item={current}
        onAddToCart={onAddToCart}
        onToggleLike={(it: any) => handleToggleLike(it)}
        onOpenComments={(it: any) => {
          setCurrent(it);
          setCommentsOpen(true);
          enqueueRankingEventWeb({
            surface: 'home',
            eventName: 'comment',
            itemId: String(it.id),
            itemType: it?.type === 'service' || it?.service_listing_id ? 'service' : 'product',
            sellerId: it?.seller?.id || null,
          });
        }}
        onOpenLikes={(it: any) => {
          setCurrent(it);
          setLikesOpen(true);
        }}
        onToggleWishlist={(it: any) => handleToggleWishlist(it)}
        onShare={(it: any) => handleShare(it)}
      />
      <HomeCommentsSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} item={current} />
      <HomeLikesSheet open={likesOpen} onClose={() => setLikesOpen(false)} item={current} />
    </>
  );
}

