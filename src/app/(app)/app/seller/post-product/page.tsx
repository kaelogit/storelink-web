'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';

type DescriptionStyle = 'luxury_lagos' | 'friendly_relatable' | 'sharp_minimal' | 'bold_standout';

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

export default function AppSellerPostProductPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [postToStory, setPostToStory] = useState(false);
  const [isDiamond, setIsDiamond] = useState(false);
  const [descriptionStyle, setDescriptionStyle] = useState<DescriptionStyle>('friendly_relatable');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [diamondSheetOpen, setDiamondSheetOpen] = useState(false);
  const [diamondFeatureLabel, setDiamondFeatureLabel] = useState('this feature');
  const [loading, setLoading] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStage, setPublishStage] = useState<'uploading' | 'finalizing' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSheetOpen, setResultSheetOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!active || !userId) return;
      const { data: profile } = await supabase.from('profiles').select('subscription_plan').eq('id', userId).maybeSingle();
      if (!active) return;
      setIsDiamond(String(profile?.subscription_plan || '').toLowerCase() === 'diamond');
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const onPickImages = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(ev.target.files || []).slice(0, Math.max(0, 4 - files.length));
    if (!picked.length) return;
    setIsOptimizing(true);
    try {
      const optimized = [];
      for (const file of picked) {
        optimized.push(await optimizeImageForUpload(file));
      }
      setFiles((prev) => [...prev, ...optimized].slice(0, 4));
      setPreviewUrls((prev) => [...prev, ...optimized.map((f) => URL.createObjectURL(f))].slice(0, 4));
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const openDiamondSheet = (feature: string) => {
    setDiamondFeatureLabel(feature);
    setDiamondSheetOpen(true);
  };

  const runAIDescription = async (isRewrite: boolean) => {
    if (!isDiamond) {
      openDiamondSheet('Gemini AI copywriting');
      return;
    }
    if (!name.trim()) {
      setError('Enter a product name first.');
      return;
    }
    setError(null);
    setIsGeneratingDesc(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-description', {
        body: {
          productName: name.trim(),
          priceNaira: price ? parseFloat(price) : undefined,
          style: descriptionStyle,
          isRewrite,
          currentDescription: isRewrite ? description : undefined,
          angleIndex: isRewrite ? undefined : Math.floor(Math.random() * 4),
        },
      });
      if (invokeError) throw invokeError;
      if (data?.description) setDescription(String(data.description).slice(0, 500));
    } catch (e: any) {
      setError(e?.message || 'AI description failed.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const processAIBackground = async (idx: number) => {
    if (!isDiamond) {
      openDiamondSheet('AI background clean');
      return;
    }
    const file = files[idx];
    if (!file) return;
    setError(null);
    setIsAIProcessing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').split('base64,')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error: invokeError } = await supabase.functions.invoke('remove-background', {
        body: { image_b64: base64 },
      });
      if (invokeError) throw invokeError;
      if (!data?.image) throw new Error('AI returned empty result.');
      const bytes = Uint8Array.from(atob(String(data.image)), (c) => c.charCodeAt(0));
      const cleaned = new File([bytes], `ai_clean_${Date.now()}.png`, { type: 'image/png' });
      const optimized = await optimizeImageForUpload(cleaned);
      setFiles((prev) => prev.map((f, i) => (i === idx ? optimized : f)));
      const nextPreview = URL.createObjectURL(optimized);
      setPreviewUrls((prev) => prev.map((u, i) => (i === idx ? nextPreview : u)));
    } catch (e: any) {
      setError(e?.message || 'AI background clean failed.');
    } finally {
      setIsAIProcessing(false);
    }
  };

  const uploadFile = async (userId: string, file: File, index: number) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/prod_${Date.now()}_${index}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, {
      contentType: file.type || `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setError(null);
    setResultSheetOpen(false);
    if (!name.trim() || !price || files.length === 0 || description.trim().length < 100) {
      setError('Provide title, price, at least one image, and description with at least 100 characters.');
      return;
    }

    setLoading(true);
    setPublishStage('uploading');
    setPublishProgress(6);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Please login again.');
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller,is_verified,onboarding_completed,bank_details,currency_code,location_country,seller_type,subscription_plan')
        .eq('id', userId)
        .maybeSingle();
      setIsDiamond(String(profile?.subscription_plan || '').toLowerCase() === 'diamond');
      if (!profile?.is_seller) throw new Error('Seller access required.');
      if (!profile?.is_verified || !profile?.onboarding_completed) {
        throw new Error('Complete seller verification/onboarding before posting.');
      }
      if (!profile?.bank_details?.recipient_code) {
        throw new Error('Set up bank details before posting.');
      }
      if (profile?.seller_type === 'service') {
        throw new Error('Your seller type only allows service listings.');
      }

      setPublishProgress(14);
      const uploaded = [];
      for (let i = 0; i < files.length; i += 1) {
        uploaded.push(await uploadFile(userId, files[i], i));
        setPublishProgress(14 + Math.round(((i + 1) / Math.max(1, files.length)) * 55));
      }

      setPublishStage('finalizing');
      setPublishProgress(78);
      const { data: created, error: createError } = await supabase
        .from('products')
        .insert({
          seller_id: userId,
          name: name.trim(),
          price: Number(price),
          stock_quantity: Number(stock || 1),
          description: description.trim(),
          image_urls: uploaded,
          image_ratio: 1.25,
          currency_code: profile?.currency_code || 'NGN',
          location_country: profile?.location_country || 'Nigeria',
          is_active: true,
        })
        .select()
        .single();
      if (createError) throw createError;

      if (postToStory && created?.id) {
        setPublishProgress(88);
        await supabase.from('stories').insert({
          seller_id: userId,
          media_url: uploaded[0],
          type: 'image',
          linked_product_id: created.id,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        });
      }

      setPublishProgress(100);
      setName('');
      setPrice('');
      setStock('1');
      setDescription('');
      setFiles([]);
      setPreviewUrls([]);
      setPostToStory(false);
      setResultSheetOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to post product.');
    } finally {
      setLoading(false);
      setPublishStage(null);
      setPublishProgress(0);
    }
  };

  return (
    <>
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Product Studio</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-(--foreground)">Post Product</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/post" className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-600 text-white text-sm font-black disabled:opacity-50"
            >
              {!loading ? <Upload size={14} /> : null}
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto">
          {previewUrls.map((url, idx) => (
            <div key={url} className="relative w-40 h-52 rounded-3xl border border-(--border) overflow-hidden shrink-0">
              <img src={url} alt="product" className="w-full h-full object-cover" />
              <button type="button" onClick={() => processAIBackground(idx)} disabled={isAIProcessing || loading} className="absolute top-2 left-2 h-7 rounded-lg bg-black/70 px-2 text-[10px] font-black text-white inline-flex items-center gap-1 disabled:opacity-50">
                <Wand2 size={11} /> AI CLEAN
              </button>
              <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white inline-flex items-center justify-center">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {previewUrls.length < 4 ? (
            <label className="w-40 h-52 rounded-3xl border border-dashed border-(--border) bg-(--surface) shrink-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
              <Camera size={20} className="text-(--foreground)" />
              <span className="text-xs font-bold text-(--muted)">Add Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
            </label>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">PRODUCT NAME</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full h-12 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)" placeholder="Title of your item" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black tracking-widest text-(--muted)">PRICE (NGN)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} className="mt-2 w-full h-12 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-black text-emerald-600" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-black tracking-widest text-(--muted)">STOCK</label>
              <input value={stock} onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ''))} className="mt-2 w-full h-12 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)" placeholder="1" />
            </div>
          </div>

          <div>
            {isDiamond ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {(['luxury_lagos', 'friendly_relatable', 'sharp_minimal', 'bold_standout'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setDescriptionStyle(style)}
                    className={`h-9 rounded-xl border px-3 text-[11px] font-black ${descriptionStyle === style ? 'border-violet-500 text-violet-600 bg-violet-50 dark:bg-violet-950/20' : 'border-(--border) text-(--muted) bg-(--surface)'}`}
                  >
                    {style === 'luxury_lagos' ? 'Luxury' : style === 'friendly_relatable' ? 'Friendly' : style === 'sharp_minimal' ? 'Minimal' : 'Bold'}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <label className="text-xs font-black tracking-widest text-(--muted)">DESCRIPTION</label>
              <div className="inline-flex items-center gap-2">
                <button type="button" onClick={() => runAIDescription(false)} disabled={isGeneratingDesc || loading} className="h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 px-2 text-[10px] font-black text-violet-600 disabled:opacity-50">
                  {isGeneratingDesc ? 'AI...' : 'AI WRITE'}
                </button>
                <button type="button" onClick={() => runAIDescription(true)} disabled={isGeneratingDesc || loading || !description.trim()} className="h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 px-2 text-[10px] font-black text-violet-600 disabled:opacity-50">
                  REWRITE
                </button>
                <span className="text-[11px] text-(--muted)">{description.length}/500</span>
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              className="mt-2 w-full h-32 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--foreground) resize-none"
              placeholder="Tell your customers about material, fit, usage..."
            />
            <p className="mt-1 text-xs text-(--muted)">Minimum 100 characters required.</p>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-(--foreground)">
              <Sparkles size={14} className="text-violet-500" /> Auto-post to story
            </span>
            <input type="checkbox" checked={postToStory} onChange={(e) => setPostToStory(e.target.checked)} className="h-4 w-4 accent-violet-600" />
          </label>
          {isOptimizing ? <p className="text-xs font-semibold text-(--muted)">Optimizing selected images...</p> : null}
          {isDiamond ? <p className="text-xs font-semibold text-violet-600">Diamond product studio active</p> : <p className="text-xs font-semibold text-(--muted)">Standard listing active</p>}

          {error ? <p className="text-sm font-semibold text-red-500">{error}</p> : null}
        </div>
      </div>
      {diamondSheetOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-(--border) bg-(--card) p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">Diamond Exclusive</p>
            <h3 className="mt-2 text-xl font-black text-(--foreground)">Upgrade to continue</h3>
            <p className="mt-2 text-sm text-(--muted)">
              <span className="font-bold text-(--foreground)">{diamondFeatureLabel}</span> is available for Diamond sellers only. Upgrade now to unlock full product studio AI tools.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDiamondSheetOpen(false)}
                className="h-10 px-4 rounded-xl border border-(--border) text-sm font-bold text-(--foreground)"
              >
                Not now
              </button>
              <Link
                href="/app/subscription"
                onClick={() => setDiamondSheetOpen(false)}
                className="inline-flex h-10 items-center rounded-xl bg-violet-600 px-4 text-sm font-black text-white"
              >
                Upgrade to Diamond
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    <PostPublishingOverlay
      open={loading}
      label="Publishing product"
      progress={publishProgress}
      stage={publishStage}
      tone="emerald"
    />
    <PostPublishResultSheet
      open={resultSheetOpen}
      onClose={() => setResultSheetOpen(false)}
      title="Product is live"
      description="Your product is on your store. If you enabled auto-post to story, a 12-hour story was created too."
      tone="emerald"
      primaryAction={{ label: 'My profile', href: '/app/profile' }}
      secondaryAction={{ label: 'Post hub', href: '/app/post' }}
    />
    </>
  );
}

