'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, Film, ImageIcon, Loader2, Type, Upload } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';

const STORY_TEXT_MAX_LENGTH = 120;
const STORY_VIDEO_MAX_SEC = 60;

const STORY_BG_PRESETS: { id: string; label: string; bg: string; textColor: string }[] = [
  { id: 'none', label: 'Charcoal', bg: '#1a1a1a', textColor: '#ffffff' },
  { id: 'indigo', label: 'Indigo', bg: '#4f46e5', textColor: '#ffffff' },
  { id: 'orange', label: 'Orange', bg: '#ea580c', textColor: '#ffffff' },
  { id: 'purple', label: 'Purple', bg: '#7c3aed', textColor: '#ffffff' },
  { id: 'emerald', label: 'Emerald', bg: '#059669', textColor: '#ffffff' },
  { id: 'rose', label: 'Rose', bg: '#e11d48', textColor: '#ffffff' },
  { id: 'amber', label: 'Amber', bg: '#d97706', textColor: '#000000' },
  { id: 'sky', label: 'Sky', bg: '#0284c7', textColor: '#ffffff' },
  { id: 'violet', label: 'Violet', bg: '#6d28d9', textColor: '#ffffff' },
];

async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= 250 * 1024) return file;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const noNeedToCompress = img.width <= 1280 && file.size <= 1.2 * 1024 * 1024;
  if (noNeedToCompress) return file;

  const maxWidth = 1440;
  const ratio = Math.min(1, maxWidth / img.width);
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9));
  if (!blob) return file;
  if (blob.size >= file.size * 0.98) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

type StoryMode = 'image' | 'video' | 'text';

export default function AppSellerPostStoryPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [mode, setMode] = useState<StoryMode>('image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);
  const [storyText, setStoryText] = useState('');
  const [storyBackgroundId, setStoryBackgroundId] = useState('none');
  const [storyFont, setStoryFont] = useState('system');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [sellerType, setSellerType] = useState<'product' | 'service' | 'both'>('both');
  const [linkType, setLinkType] = useState<'product' | 'service'>('product');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'finalizing' | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);

  const canLinkProduct = sellerType === 'product' || sellerType === 'both';
  const canLinkService = sellerType === 'service' || sellerType === 'both';
  const showLinkTypeTabs = canLinkProduct && canLinkService;

  const bgPreset = STORY_BG_PRESETS.find((p) => p.id === storyBackgroundId) || STORY_BG_PRESETS[0];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!active || !userId) return;
        const { data: profile } = await supabase.from('profiles').select('seller_type').eq('id', userId).maybeSingle();
        if (!active) return;
        const nextType = String(profile?.seller_type || 'both') as 'product' | 'service' | 'both';
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
        const queries: any[] = [];
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Please login again.');
      const queries: any[] = [];
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

  const clearMediaPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageFile(null);
    setVideoFile(null);
    setVideoDurationSec(null);
  };

  const setModeAndReset = (next: StoryMode) => {
    setMode(next);
    setError(null);
    setResultSheetOpen(false);
    clearMediaPreview();
    if (next !== 'text') {
      setStoryText('');
      setStoryBackgroundId('none');
      setStoryFont('system');
    }
  };

  const onPickImage = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] || null;
    setError(null);
    clearMediaPreview();
    if (!file) return;
    setIsOptimizingImage(true);
    try {
      const optimized = await optimizeImageForUpload(file);
      setImageFile(optimized);
      setPreviewUrl(URL.createObjectURL(optimized));
    } finally {
      setIsOptimizingImage(false);
    }
    ev.target.value = '';
  };

  const onPickVideo = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0] || null;
    setError(null);
    clearMediaPreview();
    setVideoFile(file);
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? Math.round(probe.duration) : null;
      setVideoDurationSec(duration);
      if (duration && duration > STORY_VIDEO_MAX_SEC) {
        setError(`Story videos can be up to ${STORY_VIDEO_MAX_SEC} seconds. Pick a shorter clip.`);
        clearMediaPreview();
      }
    };
    probe.src = url;
    ev.target.value = '';
  };

  const uploadToStoriesBucket = async (userId: string, file: File, kind: 'image' | 'video') => {
    const ext = (file.name.split('.').pop() || (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase();
    const path = `${userId}/story_${Date.now()}.${ext}`;
    const contentType = file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
    setUploadStage('uploading');
    setUploadProgress(20);
    const { error } = await supabase.storage.from('stories').upload(path, file, { contentType, upsert: false });
    if (error) throw error;
    setUploadProgress(85);
    const { data } = supabase.storage.from('stories').getPublicUrl(path);
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

    if (showLinkTypeTabs) {
      if (linkType === 'product' && !selectedProductId) {
        setError('Link a product to this story.');
        return;
      }
      if (linkType === 'service' && !selectedServiceId) {
        setError('Link a service to this story.');
        return;
      }
    } else if (canLinkProduct && !selectedProductId) {
      setError('Link a product to this story.');
      return;
    } else if (canLinkService && !selectedServiceId) {
      setError('Link a service to this story.');
      return;
    }

    if (mode === 'text') {
      if (!storyText.trim()) {
        setError('Write something for your text story.');
        return;
      }
      if (storyText.trim().length > STORY_TEXT_MAX_LENGTH) {
        setError(`Text stories are limited to ${STORY_TEXT_MAX_LENGTH} characters.`);
        return;
      }
    } else if (mode === 'image') {
      if (!imageFile) {
        setError('Select a photo for your story.');
        return;
      }
    } else {
      if (!videoFile) {
        setError('Select a video for your story.');
        return;
      }
      if (videoDurationSec != null && videoDurationSec > STORY_VIDEO_MAX_SEC) {
        setError(`Story videos can be up to ${STORY_VIDEO_MAX_SEC} seconds.`);
        return;
      }
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
      const { data: profile } = await supabase.from('profiles').select('is_seller').eq('id', userId).maybeSingle();
      if (!profile?.is_seller) throw new Error('Seller access required.');

      const linkedProductId = showLinkTypeTabs ? (linkType === 'product' ? selectedProductId || null : null) : canLinkProduct ? selectedProductId || null : null;
      const linkedServiceId = showLinkTypeTabs ? (linkType === 'service' ? selectedServiceId || null : null) : canLinkService ? selectedServiceId || null : null;

      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

      if (mode === 'text') {
        setUploadStage('finalizing');
        setUploadProgress(95);
        const { error: insertError } = await supabase.from('stories').insert({
          seller_id: userId,
          media_url: '',
          linked_product_id: linkedProductId,
          service_listing_id: linkedServiceId,
          type: 'text',
          story_text: storyText.trim(),
          story_background_color: storyBackgroundId,
          story_font: storyFont,
          drawing_overlay_url: null,
          expires_at: expiresAt,
        } as any);
        if (insertError) throw insertError;
        setUploadProgress(100);
        setStoryText('');
        setStoryBackgroundId('none');
        setStoryFont('system');
        setResultSheetOpen(true);
      } else if (mode === 'image' && imageFile) {
        const publicUrl = await uploadToStoriesBucket(userId, imageFile, 'image');
        setUploadStage('finalizing');
        setUploadProgress(94);
        const { error: insertError } = await supabase.from('stories').insert({
          seller_id: userId,
          media_url: publicUrl,
          linked_product_id: linkedProductId,
          service_listing_id: linkedServiceId,
          type: 'image',
          drawing_overlay_url: null,
          expires_at: expiresAt,
        } as any);
        if (insertError) throw insertError;
        setUploadProgress(100);
        clearMediaPreview();
        setResultSheetOpen(true);
      } else if (mode === 'video' && videoFile) {
        const publicUrl = await uploadToStoriesBucket(userId, videoFile, 'video');
        setUploadStage('finalizing');
        setUploadProgress(94);
        const { error: insertError } = await supabase.from('stories').insert({
          seller_id: userId,
          media_url: publicUrl,
          linked_product_id: linkedProductId,
          service_listing_id: linkedServiceId,
          type: 'video',
          drawing_overlay_url: null,
          expires_at: expiresAt,
        } as any);
        if (insertError) throw insertError;
        setUploadProgress(100);
        clearMediaPreview();
        setResultSheetOpen(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to post story.');
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
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">Story Studio</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-(--foreground)">Post Story</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/post" className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-black text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {submitting
                ? `${uploadStage === 'finalizing' ? 'FINALIZING' : 'UPLOADING'} ${Math.max(1, uploadProgress)}%`
                : 'Post'}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-(--muted)">
          12-hour story drops — photo, short video (up to {STORY_VIDEO_MAX_SEC}s), or text. Link a catalog item so shoppers can tap through.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-(--border) bg-(--surface) p-1.5">
          <button
            type="button"
            onClick={() => setModeAndReset('image')}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-black ${mode === 'image' ? 'bg-amber-600 text-white' : 'text-(--muted)'}`}
          >
            <ImageIcon size={14} /> Photo
          </button>
          <button
            type="button"
            onClick={() => setModeAndReset('video')}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-black ${mode === 'video' ? 'bg-amber-600 text-white' : 'text-(--muted)'}`}
          >
            <Film size={14} /> Video
          </button>
          <button
            type="button"
            onClick={() => setModeAndReset('text')}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-black ${mode === 'text' ? 'bg-amber-600 text-white' : 'text-(--muted)'}`}
          >
            <Type size={14} /> Text
          </button>
        </div>

        {mode === 'text' ? (
          <div className="mt-5 space-y-4 rounded-2xl border border-(--border) bg-(--surface) p-4">
            <div
              className="flex min-h-[200px] items-center justify-center rounded-xl border border-(--border) p-6 text-center"
              style={{ backgroundColor: bgPreset.bg, color: bgPreset.textColor }}
            >
              <p
                className="max-w-sm text-lg font-semibold leading-relaxed"
                style={{
                  fontFamily: storyFont === 'serif' ? 'Georgia, serif' : storyFont === 'mono' ? 'ui-monospace, monospace' : 'inherit',
                  fontWeight: storyFont === 'rounded' ? 800 : 600,
                  letterSpacing: storyFont === 'mono' ? '0.04em' : undefined,
                }}
              >
                {storyText.trim() || 'Your story text…'}
              </p>
            </div>
            <div>
              <label className="text-xs font-black tracking-widest text-(--muted)">BACKGROUND</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {STORY_BG_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.label}
                    onClick={() => setStoryBackgroundId(p.id)}
                    className={`h-9 w-9 rounded-full border-2 ${storyBackgroundId === p.id ? 'border-amber-500 ring-2 ring-amber-400/50' : 'border-transparent'}`}
                    style={{ backgroundColor: p.bg }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black tracking-widest text-(--muted)">FONT</label>
              <select
                value={storyFont}
                onChange={(e) => setStoryFont(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-semibold text-(--foreground)"
              >
                <option value="system">Classic</option>
                <option value="serif">Serif</option>
                <option value="mono">Mono</option>
                <option value="rounded">Bold rounded</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black tracking-widest text-(--muted)">TEXT</label>
                <span className="text-xs text-(--muted)">{storyText.length}/{STORY_TEXT_MAX_LENGTH}</span>
              </div>
              <textarea
                value={storyText}
                maxLength={STORY_TEXT_MAX_LENGTH}
                onChange={(e) => setStoryText(e.target.value)}
                className="mt-2 h-28 w-full rounded-xl border border-(--border) bg-(--card) px-4 py-3 text-sm font-medium text-(--foreground)"
                placeholder="Drop a quick update for your followers…"
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-(--border) px-4 text-sm font-bold text-(--foreground)">
              {mode === 'video' ? <Film size={15} /> : <Camera size={15} />}
              {mode === 'video' ? 'Select video' : 'Select photo'}
              <input
                type="file"
                accept={mode === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                onChange={mode === 'video' ? onPickVideo : onPickImage}
              />
            </label>
            {isOptimizingImage ? <p className="mt-2 text-xs font-semibold text-(--muted)">Optimizing image…</p> : null}
            {mode === 'video' && videoDurationSec != null ? (
              <p className="mt-2 text-xs font-semibold text-(--muted)">
                Duration: {videoDurationSec}s (max {STORY_VIDEO_MAX_SEC}s)
              </p>
            ) : null}
            {previewUrl && mode === 'video' ? (
              <video src={previewUrl} controls className="mt-3 max-h-[420px] w-full rounded-xl border border-(--border) bg-black" />
            ) : null}
            {previewUrl && mode === 'image' ? (
              <img src={previewUrl} alt="Story preview" className="mt-3 max-h-[420px] w-full rounded-xl border border-(--border) object-contain" />
            ) : null}
            {previewUrl ? (
              <button
                type="button"
                onClick={() => {
                  clearMediaPreview();
                  setError(null);
                }}
                className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-400"
              >
                Clear media
              </button>
            ) : null}
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-(--border) bg-(--surface) p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-(--muted)">LINK TO CATALOG</p>
            <button type="button" onClick={loadCatalog} disabled={loadingCatalog} className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {loadingCatalog ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {showLinkTypeTabs ? (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-(--border) bg-(--card) p-1.5">
              <button
                type="button"
                onClick={() => setLinkType('product')}
                className={`h-9 rounded-lg text-xs font-black ${linkType === 'product' ? 'bg-amber-600 text-white' : 'text-(--muted)'}`}
              >
                Product
              </button>
              <button
                type="button"
                onClick={() => setLinkType('service')}
                className={`h-9 rounded-lg text-xs font-black ${linkType === 'service' ? 'bg-amber-600 text-white' : 'text-(--muted)'}`}
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

        <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/25 dark:text-amber-200">
          <p className="font-black">Stories expire after 12 hours</p>
          <p className="mt-1 text-xs opacity-90">Same behavior as the mobile app — link stays tappable while the story is live.</p>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}
      </div>
    </div>
    <PostPublishingOverlay
      open={submitting}
      label="Publishing story"
      progress={uploadProgress}
      stage={uploadStage}
      tone="amber"
    />
    <PostPublishResultSheet
      open={resultSheetOpen}
      onClose={() => setResultSheetOpen(false)}
      title="Story is live"
      description="Your story is on your profile for the next 12 hours. Shoppers can tap your catalog link while it is active."
      tone="amber"
      primaryAction={{ label: 'Go to home', href: '/app' }}
      secondaryAction={{ label: 'Post hub', href: '/app/post' }}
    />
    </>
  );
}
