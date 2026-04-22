'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clapperboard, Loader2, Package, Store, Upload, CalendarCheck } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';

type EligibleSeller = {
  id: string;
  slug: string | null;
  display_name: string | null;
  logo_url: string | null;
  source_kind: 'order' | 'service_order';
};

export default function AppSpotlightPostPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [eligibleSellers, setEligibleSellers] = useState<EligibleSeller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'finalizing' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);

  const loadEligibleSellers = useCallback(async () => {
    setLoadingEligible(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setEligibleSellers([]);
        return;
      }
      const [{ data: orders }, { data: serviceOrders }] = await Promise.all([
        supabase
          .from('orders')
          .select('seller_id,seller:profiles!seller_id(id,slug,display_name,logo_url),created_at')
          .eq('user_id', userId)
          .eq('status', 'COMPLETED')
          .order('created_at', { ascending: false })
          .limit(120),
        supabase
          .from('service_orders')
          .select('seller_id,seller:profiles!seller_id(id,slug,display_name,logo_url),created_at')
          .eq('buyer_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(120),
      ]);

      const dedup = new Map<string, EligibleSeller>();
      (orders || []).forEach((row: any) => {
        const seller = row?.seller;
        const sellerId = String(row?.seller_id || '');
        if (!sellerId || !seller) return;
        if (!dedup.has(sellerId)) {
          dedup.set(sellerId, {
            id: sellerId,
            slug: seller.slug || null,
            display_name: seller.display_name || null,
            logo_url: seller.logo_url || null,
            source_kind: 'order',
          });
        }
      });
      (serviceOrders || []).forEach((row: any) => {
        const seller = row?.seller;
        const sellerId = String(row?.seller_id || '');
        if (!sellerId || !seller) return;
        if (!dedup.has(sellerId)) {
          dedup.set(sellerId, {
            id: sellerId,
            slug: seller.slug || null,
            display_name: seller.display_name || null,
            logo_url: seller.logo_url || null,
            source_kind: 'service_order',
          });
        }
      });
      setEligibleSellers(Array.from(dedup.values()));
    } catch (e: any) {
      setError(e?.message || 'Could not load eligible sellers.');
    } finally {
      setLoadingEligible(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadEligibleSellers();
  }, [loadEligibleSellers]);

  const onPickVideo = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] || null;
    setVideoFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const uploadVideo = async (userId: string, file: File) => {
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const path = `spotlight/${userId}/spotlight_${Date.now()}.${ext}`;
    setUploadStage('uploading');
    setUploadProgress(20);
    const { error } = await supabase.storage.from('reels').upload(path, file, { contentType: file.type || 'video/mp4', upsert: false });
    if (error) throw error;
    setUploadProgress(82);
    const { data } = supabase.storage.from('reels').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setError(null);
    setResultSheetOpen(false);
    if (!videoFile) return setError('Select a spotlight video first.');
    if (!selectedSellerId) return setError('Select the seller you are spotlighting.');
    if (caption.trim().length < 20) return setError('Caption must be at least 20 characters.');

    setSubmitting(true);
    setUploadProgress(8);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Please login again.');
      const videoUrl = await uploadVideo(userId, videoFile);
      setUploadStage('finalizing');
      setUploadProgress(92);
      const nonce = `${userId}:${Date.now()}:${selectedSellerId}`;
      const { error: rpcError } = await supabase.rpc('upsert_spotlight_post', {
        p_post_id: null,
        p_creator_id: userId,
        p_media_url: videoUrl,
        p_thumbnail_url: null,
        p_caption: caption.trim(),
        p_tagged_seller_id: selectedSellerId,
        p_client_nonce: nonce,
        p_visibility: 'public',
      } as any);
      if (rpcError) throw rpcError;
      setUploadProgress(100);
      setCaption('');
      setVideoFile(null);
      setPreviewUrl(null);
      setSelectedSellerId('');
      setResultSheetOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to post spotlight.');
    } finally {
      setSubmitting(false);
      setUploadStage(null);
      setUploadProgress(0);
    }
  };

  return (
    <>
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">Spotlight Composer</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground)">Post Spotlight</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/post" className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || eligibleSellers.length === 0}
              title={eligibleSellers.length === 0 ? 'Complete a purchase or booking first to tag a seller.' : undefined}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-(--muted)">Share a short video that tags the store from a completed purchase or service booking.</p>

        <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--border) px-4 text-sm font-bold text-(--foreground) cursor-pointer">
            <Clapperboard size={15} /> Select Spotlight Video
            <input type="file" accept="video/*" className="hidden" onChange={onPickVideo} />
          </label>
          {previewUrl ? <video src={previewUrl} controls className="mt-3 w-full rounded-xl border border-(--border) bg-black max-h-[420px]" /> : null}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-black tracking-widest text-(--muted)">TAG SELLER</label>
            {!loadingEligible && eligibleSellers.length > 0 ? (
              <button type="button" onClick={() => void loadEligibleSellers()} className="text-xs font-bold text-violet-600 dark:text-violet-400">
                Refresh list
              </button>
            ) : null}
          </div>

          {loadingEligible ? (
            <p className="mt-3 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--muted)">Finding sellers from your completed orders and bookings…</p>
          ) : eligibleSellers.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-violet-200/90 bg-violet-50/90 p-4 dark:border-violet-800/60 dark:bg-violet-950/35">
              <p className="text-sm font-bold text-(--foreground)">No sellers to tag yet</p>
              <p className="mt-2 text-sm leading-relaxed text-(--muted)">
                Spotlights are for stores you have already bought from or booked with—after checkout completes, they appear here so you can tag them. Explore products or services and come back once you have a completed order or booking.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/app/explore"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-black text-white"
                >
                  <Store size={15} /> Shop & explore
                </Link>
                <Link
                  href="/app/orders"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-4 text-xs font-black text-(--foreground)"
                >
                  <Package size={15} /> My orders
                </Link>
                <Link
                  href="/app/bookings"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-4 text-xs font-black text-(--foreground)"
                >
                  <CalendarCheck size={15} /> My bookings
                </Link>
              </div>
            </div>
          ) : (
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground)"
            >
              <option value="">Select seller you bought or booked with</option>
              {eligibleSellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.display_name || s.slug || 'Seller')} ({s.source_kind === 'service_order' ? 'service booking' : 'product order'})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black tracking-widest text-(--muted)">CAPTION</label>
            <span className="text-xs text-(--muted)">{caption.trim().length}/20 min</span>
          </div>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-2 h-28 w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--foreground)" placeholder="Share your buy/booking outcome..." />
        </div>

        <div className="mt-4 rounded-2xl border border-violet-300/40 bg-violet-50/70 p-4 text-xs font-semibold leading-relaxed text-violet-900 dark:border-violet-800/50 dark:bg-violet-950/25 dark:text-violet-200">
          <p className="inline-flex items-center gap-2 font-black text-sm text-violet-950 dark:text-violet-100">
            <Clapperboard size={16} /> How spotlight works
          </p>
          <p className="mt-2">
            Tag the seller from a completed checkout, tell the story in your caption, and your clip can surface in spotlight feeds as buyer proof of purchase or booking.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}

      </div>
    </div>
    <PostPublishingOverlay
      open={submitting}
      label="Publishing spotlight"
      progress={uploadProgress}
      stage={uploadStage}
      tone="violet"
    />
    <PostPublishResultSheet
      open={resultSheetOpen}
      onClose={() => setResultSheetOpen(false)}
      title="Spotlight published"
      description="Your spotlight is live. It can appear in spotlight feeds for other shoppers to discover."
      tone="violet"
      primaryAction={{ label: 'Explore', href: '/app/explore' }}
      secondaryAction={{ label: 'Post hub', href: '/app/post' }}
    />
    </>
  );
}

