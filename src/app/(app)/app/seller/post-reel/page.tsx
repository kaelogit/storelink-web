'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Film, Loader2, Sparkles, Upload } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';

export default function AppSellerPostReelPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [sellerType, setSellerType] = useState<'product' | 'service' | 'both'>('both');
  const [linkType, setLinkType] = useState<'product' | 'service'>('product');
  const [mirrorToStory, setMirrorToStory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'finalizing' | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);

  const canLinkProduct = sellerType === 'product' || sellerType === 'both';
  const canLinkService = sellerType === 'service' || sellerType === 'both';
  const showLinkTypeTabs = canLinkProduct && canLinkService;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!active || !userId) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('seller_type')
          .eq('id', userId)
          .maybeSingle();
        if (!active) return;
        const nextType = (String(profile?.seller_type || 'both') as 'product' | 'service' | 'both');
        setSellerType(nextType);
        if (nextType === 'service') setLinkType('service');
        if (nextType === 'product') setLinkType('product');
      } catch {
        // noop
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingCatalog(true);
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!active || !userId) return;
        const queries: Promise<any>[] = [];
        if (canLinkProduct) {
          queries.push(
            supabase.from('products').select('id,name,price').eq('seller_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(50),
          );
        }
        if (canLinkService) {
          queries.push(
            supabase.from('service_listings').select('id,title,hero_price_min').eq('seller_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(50),
          );
        }
        const results = await Promise.all(queries);
        if (!active) return;
        if (canLinkProduct && canLinkService) {
          setProducts(results[0]?.data || []);
          setServices(results[1]?.data || []);
        } else if (canLinkProduct) {
          setProducts(results[0]?.data || []);
          setServices([]);
        } else {
          setProducts([]);
          setServices(results[0]?.data || []);
        }
      } finally {
        if (active) setLoadingCatalog(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, canLinkProduct, canLinkService]);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Please login again.');
      const queries: Promise<any>[] = [];
      if (canLinkProduct) {
        queries.push(
          supabase.from('products').select('id,name,price').eq('seller_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(50),
        );
      }
      if (canLinkService) {
        queries.push(
          supabase.from('service_listings').select('id,title,hero_price_min').eq('seller_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(50),
        );
      }
      const results = await Promise.all(queries);
      if (canLinkProduct && canLinkService) {
        setProducts(results[0]?.data || []);
        setServices(results[1]?.data || []);
      } else if (canLinkProduct) {
        setProducts(results[0]?.data || []);
        setServices([]);
      } else {
        setProducts([]);
        setServices(results[0]?.data || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load catalog.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const onPickVideo = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] || null;
    setError(null);
    setVideoFile(file);
    const url = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(url);
    if (!file || !url) {
      setVideoDurationSec(null);
      return;
    }
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? Math.round(probe.duration) : null;
      setVideoDurationSec(duration);
      if (duration && duration > 180) {
        setError('Reel max length is 3 minutes. Select a shorter video.');
        setVideoFile(null);
      }
    };
    probe.src = url;
  };

  const uploadVideo = async (userId: string, file: File) => {
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const path = `${userId}/reel_${Date.now()}.${ext}`;
    setUploadStage('uploading');
    setUploadProgress(25);
    const { error } = await supabase.storage.from('reels').upload(path, file, { contentType: file.type || 'video/mp4', upsert: false });
    if (error) throw error;
    setUploadProgress(85);
    const { data } = supabase.storage.from('reels').getPublicUrl(path);
    return data.publicUrl;
  };

  const ensureLinkedEntityStillActive = async (userId: string): Promise<boolean> => {
    if (showLinkTypeTabs) {
      if (linkType === 'product' && selectedProductId) {
        const { data, error: checkError } = await supabase
          .from('products')
          .select('id,is_active,stock_quantity')
          .eq('id', selectedProductId)
          .eq('seller_id', userId)
          .maybeSingle();
        if (checkError || !data || !data.is_active || Number(data.stock_quantity || 0) <= 0) {
          setSelectedProductId('');
          setError('Linked product is no longer active. Pick another one.');
          return false;
        }
      }
      if (linkType === 'service' && selectedServiceId) {
        const { data, error: checkError } = await supabase
          .from('service_listings')
          .select('id,is_active')
          .eq('id', selectedServiceId)
          .eq('seller_id', userId)
          .maybeSingle();
        if (checkError || !data || !data.is_active) {
          setSelectedServiceId('');
          setError('Linked service is no longer active. Pick another one.');
          return false;
        }
      }
      return true;
    }
    if (canLinkProduct && selectedProductId) {
      const { data, error: checkError } = await supabase
        .from('products')
        .select('id,is_active,stock_quantity')
        .eq('id', selectedProductId)
        .eq('seller_id', userId)
        .maybeSingle();
      if (checkError || !data || !data.is_active || Number(data.stock_quantity || 0) <= 0) {
        setSelectedProductId('');
        setError('Linked product is no longer active. Pick another one.');
        return false;
      }
    }
    if (canLinkService && selectedServiceId) {
      const { data, error: checkError } = await supabase
        .from('service_listings')
        .select('id,is_active')
        .eq('id', selectedServiceId)
        .eq('seller_id', userId)
        .maybeSingle();
      if (checkError || !data || !data.is_active) {
        setSelectedServiceId('');
        setError('Linked service is no longer active. Pick another one.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setResultSheetOpen(false);
    if (!videoFile) {
      setError('Select a reel video first.');
      return;
    }
    if (videoDurationSec != null && videoDurationSec > 180) {
      setError('Reel max length is 3 minutes.');
      return;
    }
    if (caption.trim().length < 100) {
      setError('Caption must be at least 100 characters.');
      return;
    }
    if (mirrorToStory && videoDurationSec != null && videoDurationSec > 60) {
      setError('Story mirror supports up to 60 seconds. Use a shorter reel or disable story mirror.');
      return;
    }
    if (showLinkTypeTabs) {
      if (linkType === 'product' && !selectedProductId) {
        setError('Tag the product featured in this reel.');
        return;
      }
      if (linkType === 'service' && !selectedServiceId) {
        setError('Select the service this reel is for.');
        return;
      }
    } else if (canLinkProduct && !selectedProductId) {
      setError('Tag the product featured in this reel.');
      return;
    } else if (canLinkService && !selectedServiceId) {
      setError('Select the service this reel is for.');
      return;
    }
    setSubmitting(true);
    setUploadProgress(5);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Please login again.');
      const linkStillValid = await ensureLinkedEntityStillActive(userId);
      if (!linkStillValid) {
        setSubmitting(false);
        setUploadStage(null);
        setUploadProgress(0);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller,seller_type,location_state,location_city')
        .eq('id', userId)
        .maybeSingle();
      if (!profile?.is_seller) throw new Error('Seller access required.');

      const videoUrl = await uploadVideo(userId, videoFile);
      setUploadStage('finalizing');
      setUploadProgress(94);
      const payload: any = {
        seller_id: userId,
        video_url: videoUrl,
        caption: caption.trim(),
        duration: null,
        location_state: profile?.location_state || null,
        location_city: profile?.location_city || null,
        product_id: selectedProductId || null,
        service_listing_id: selectedServiceId || null,
      };
      const { error: insertError } = await supabase.from('reels').insert(payload);
      if (insertError) throw insertError;
      if (mirrorToStory && selectedProductId) {
        await supabase.from('stories').insert({
          seller_id: userId,
          media_url: videoUrl,
          type: 'video',
          linked_product_id: selectedProductId,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        });
      }
      setUploadProgress(100);
      setCaption('');
      setVideoFile(null);
      setPreviewUrl(null);
      setSelectedProductId('');
      setSelectedServiceId('');
      setMirrorToStory(false);
      setResultSheetOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to post reel.');
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
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Reel Studio</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground)">Post Reel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/post" className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-50">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {submitting ? `${uploadStage === 'finalizing' ? 'FINALIZING' : 'UPLOADING'} ${Math.max(1, uploadProgress)}%` : 'Post'}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-(--muted)">Create a reel for discovery and your audience across feed surfaces.</p>

        <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--border) px-4 text-sm font-bold text-(--foreground) cursor-pointer">
            <Film size={15} /> Select Video
            <input type="file" accept="video/*" className="hidden" onChange={onPickVideo} />
          </label>
          {videoDurationSec ? <p className="mt-2 text-xs font-semibold text-(--muted)">Duration: {videoDurationSec}s (max 180s)</p> : null}
          {previewUrl ? <video src={previewUrl} controls className="mt-3 w-full rounded-xl border border-(--border) bg-black max-h-[420px]" /> : null}
        </div>

        <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-(--muted)">LINK TO CATALOG</p>
            <button type="button" onClick={loadCatalog} disabled={loadingCatalog} className="text-xs font-bold text-emerald-600">
              {loadingCatalog ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {showLinkTypeTabs ? (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-(--border) bg-(--card) p-1.5">
              <button
                type="button"
                onClick={() => setLinkType('product')}
                className={`h-9 rounded-lg text-xs font-black ${linkType === 'product' ? 'bg-emerald-600 text-white' : 'text-(--muted)'}`}
              >
                Product
              </button>
              <button
                type="button"
                onClick={() => setLinkType('service')}
                className={`h-9 rounded-lg text-xs font-black ${linkType === 'service' ? 'bg-emerald-600 text-white' : 'text-(--muted)'}`}
              >
                Service
              </button>
            </div>
          ) : null}

          {canLinkProduct && (!showLinkTypeTabs || linkType === 'product') ? (
            <div className="mt-3">
              <label className="text-[11px] font-black tracking-wider text-(--muted)">PRODUCT (required)</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-semibold text-(--foreground)"
              >
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          ) : null}

          {canLinkService && (!showLinkTypeTabs || linkType === 'service') ? (
            <div className="mt-3">
              <label className="text-[11px] font-black tracking-wider text-(--muted)">SERVICE (required)</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-semibold text-(--foreground)"
              >
                <option value="">Select service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.title || 'Service'}</option>)}
              </select>
            </div>
          ) : null}
        </div>

        <label className="mt-5 flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-(--foreground)">
            <Sparkles size={14} className="text-violet-500" /> Story mirror
          </span>
          <input type="checkbox" checked={mirrorToStory} onChange={(e) => setMirrorToStory(e.target.checked)} className="h-4 w-4 accent-violet-600" />
        </label>
        <p className="mt-1 text-xs text-(--muted)">Story mirror accepts up to 60s.</p>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black tracking-widest text-(--muted)">CAPTION</label>
            <span className="text-xs text-(--muted)">{caption.trim().length}/100 min</span>
          </div>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-2 h-32 w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--foreground)" placeholder="Describe what this reel is showing..." />
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-300/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          <p className="inline-flex items-center gap-2 font-black"><Sparkles size={14} /> Reel publishes under your seller feed</p>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}

      </div>
    </div>
    <PostPublishingOverlay
      open={submitting}
      label="Publishing reel"
      progress={uploadProgress}
      stage={uploadStage}
      tone="emerald"
    />
    <PostPublishResultSheet
      open={resultSheetOpen}
      onClose={() => setResultSheetOpen(false)}
      title="Reel published"
      description="Your reel is live on your seller feed and discovery surfaces."
      tone="emerald"
      primaryAction={{ label: 'Explore', href: '/app/explore' }}
      secondaryAction={{ label: 'Post hub', href: '/app/post' }}
    />
    </>
  );
}

