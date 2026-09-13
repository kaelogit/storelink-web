'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';
import {
  PRODUCT_CATEGORIES,
  canonicalizeProductCategorySlug,
  isPickerProductCategorySlug,
} from '@/constants/ProductCategories';
import {
  LISTING_LOCK_BANNER_BODY,
  LISTING_LOCK_BANNER_TITLE,
  LISTING_PRICE_CHANGE_CAP_PCT,
  isListingContentLocked,
  mapListingLockError,
  priceChangeWithinCap,
} from '@/lib/listingContentLock';
import {
  LISTING_TAG_CAP_TITLE,
  assertCanTagListing,
  listingTagCapBody,
  mapListingTagCapError,
} from '@/lib/listingTagCap';
import { LISTING_MAX_IMAGES } from '@/constants/listingMedia';

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

function PostProductForm() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const editId = (searchParams.get('id') || '').trim() || null;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [contentLockedAt, setContentLockedAt] = useState<string | null>(null);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [loadEdit, setLoadEdit] = useState(!!editId);
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
  const contentLocked = isListingContentLocked({ content_locked_at: contentLockedAt });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!active || !userId) return;
      const { data: profile } = await supabase.from('profiles').select('subscription_plan, category').eq('id', userId).maybeSingle();
      if (!active) return;
      setIsDiamond(String(profile?.subscription_plan || '').toLowerCase() === 'diamond');
      const fromShop = canonicalizeProductCategorySlug(profile?.category);
      if (isPickerProductCategorySlug(fromShop)) {
        setShopCategory(fromShop);
        if (!editId) setCategory(fromShop);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, editId]);

  useEffect(() => {
    if (!editId) {
      setExistingImages([]);
      setContentLockedAt(null);
      setOriginalPrice(null);
      setLoadEdit(false);
      return;
    }
    let active = true;
    (async () => {
      setLoadEdit(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          if (active) {
            setError('Please login again.');
            setLoadEdit(false);
          }
          return;
        }
        const { data, error: loadErr } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity, description, image_urls, content_locked_at, linked_post_count, category, requires_shipping')
          .eq('id', editId)
          .eq('seller_id', userId)
          .single();
        if (!active) return;
        if (loadErr || !data) {
          setError('Could not load this product for editing.');
          setLoadEdit(false);
          return;
        }
        const row = data as {
          name?: string;
          price?: number;
          stock_quantity?: number;
          description?: string;
          image_urls?: string[] | null;
          content_locked_at?: string | null;
          category?: string | null;
          requires_shipping?: boolean | null;
        };
        setName(String(row.name || ''));
        setPrice(row.price != null ? String(row.price) : '');
        setOriginalPrice(Number(row.price) || null);
        setStock(String(row.stock_quantity ?? 1));
        setRequiresShipping(row.requires_shipping !== false);
        setDescription(String(row.description || ''));
        setCategory(canonicalizeProductCategorySlug(row.category));
        setExistingImages(Array.isArray(row.image_urls) ? row.image_urls.filter(Boolean) : []);
        setContentLockedAt(row.content_locked_at ?? null);
        setFiles([]);
        setPreviewUrls([]);
        setLoadEdit(false);
      } catch {
        if (active) {
          setError('Failed to load product.');
          setLoadEdit(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [editId, supabase]);

  const onPickImages = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (contentLocked) return;
    const room = LISTING_MAX_IMAGES - existingImages.length - files.length;
    const picked = Array.from(ev.target.files || []).slice(0, Math.max(0, room));
    if (!picked.length) return;
    setIsOptimizing(true);
    try {
      const optimized: File[] = [];
      for (const file of picked) {
        optimized.push(await optimizeImageForUpload(file));
      }
      setFiles((prev) => [...prev, ...optimized]);
      setPreviewUrls((prev) => [...prev, ...optimized.map((f) => URL.createObjectURL(f))]);
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (idx: number) => {
    if (contentLocked) return;
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx: number) => {
    if (contentLocked) return;
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
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
    return uploadFileToR2(file, `product-images/${path}`);
  };

  const handleSubmit = async () => {
    setError(null);
    setResultSheetOpen(false);
    const nextPrice = Number(price);
    const imageTotal = existingImages.length + files.length;
    if (editId && contentLocked) {
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
        setError('Enter a valid price.');
        return;
      }
      if (originalPrice != null && !priceChangeWithinCap(originalPrice, nextPrice)) {
        setError(`Price can only change up to ${LISTING_PRICE_CHANGE_CAP_PCT}% while this listing is locked.`);
        return;
      }
    } else {
      if (!name.trim() || !price || imageTotal === 0 || description.trim().length < 100) {
        setError('Provide title, price, at least one image, and description with at least 100 characters.');
        return;
      }
      if (!isPickerProductCategorySlug(category)) {
        setError('Choose a product category for this listing.');
        return;
      }
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

      if (editId && contentLocked) {
        setPublishStage('finalizing');
        setPublishProgress(80);
        const { error: updateError } = await supabase
          .from('products')
          .update({
            price: nextPrice,
            stock_quantity: Number(stock || 1),
            requires_shipping: requiresShipping,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)
          .eq('seller_id', userId);
        if (updateError) throw new Error(mapListingLockError(updateError.message));
        setOriginalPrice(nextPrice);
        setPublishProgress(100);
        setResultSheetOpen(true);
        return;
      }

      if (editId && postToStory) {
        const capResult = await assertCanTagListing(supabase, {
          listingType: 'product',
          listingId: editId,
          slotsNeeded: 1,
        });
        if (!capResult.ok) {
          setError(`${LISTING_TAG_CAP_TITLE}. ${listingTagCapBody(capResult.capacity.max_per_listing, capResult.capacity.active_count)}`);
          return;
        }
      }

      setPublishProgress(14);
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        uploaded.push(await uploadFile(userId, files[i], i));
        setPublishProgress(14 + Math.round(((i + 1) / Math.max(1, files.length)) * 55));
      }
      const imageUrls = [...existingImages, ...uploaded];

      setPublishStage('finalizing');
      setPublishProgress(78);
      if (editId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: name.trim(),
            price: nextPrice,
            stock_quantity: Number(stock || 1),
            description: description.trim(),
            image_urls: imageUrls,
            image_ratio: 1.25,
            category: canonicalizeProductCategorySlug(category),
            currency_code: profile?.currency_code || 'NGN',
            location_country: profile?.location_country || 'Nigeria',
            requires_shipping: requiresShipping,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)
          .eq('seller_id', userId);
        if (updateError) throw new Error(mapListingLockError(updateError.message));
        setExistingImages(imageUrls);
        setFiles([]);
        setPreviewUrls([]);
        if (postToStory) {
          setPublishProgress(88);
          const { error: storyError } = await supabase.from('stories').insert({
            seller_id: userId,
            media_url: imageUrls[0],
            type: 'image',
            linked_product_id: editId,
            expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          });
          if (storyError) throw new Error(mapListingTagCapError(storyError.message));
        }
      } else {
        const { data: created, error: createError } = await supabase
          .from('products')
          .insert({
            seller_id: userId,
            name: name.trim(),
            price: nextPrice,
            stock_quantity: Number(stock || 1),
            description: description.trim(),
            image_urls: imageUrls,
            image_ratio: 1.25,
            category: canonicalizeProductCategorySlug(category),
            currency_code: profile?.currency_code || 'NGN',
            location_country: profile?.location_country || 'Nigeria',
            requires_shipping: requiresShipping,
            is_active: true,
          })
          .select()
          .single();
        if (createError) throw createError;

        if (postToStory && created?.id) {
          setPublishProgress(88);
          const { error: storyError } = await supabase.from('stories').insert({
            seller_id: userId,
            media_url: imageUrls[0],
            type: 'image',
            linked_product_id: created.id,
            expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          });
          if (storyError) throw new Error(mapListingTagCapError(storyError.message));
        }

        setName('');
        setPrice('');
        setStock('1');
        setDescription('');
        setCategory(shopCategory);
        setExistingImages([]);
        setFiles([]);
        setPreviewUrls([]);
        setPostToStory(false);
      }

      setPublishProgress(100);
      setResultSheetOpen(true);
    } catch (e: any) {
      setError(mapListingLockError(e?.message || (editId ? 'Failed to update product.' : 'Failed to post product.')));
    } finally {
      setLoading(false);
      setPublishStage(null);
      setPublishProgress(0);
    }
  };

  const imageTotal = existingImages.length + files.length;
  if (loadEdit) {
    return <div className="py-24 text-center text-sm text-(--muted)">Loading product…</div>;
  }

  return (
    <>
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Product Studio</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-(--foreground)">{editId ? 'Edit product' : 'Post Product'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={editId ? '/app/seller/inventory' : '/app/post'} className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-600 text-white text-sm font-black disabled:opacity-50"
            >
              {!loading ? <Upload size={14} /> : null}
              {loading ? (editId ? 'Saving…' : 'Posting...') : editId ? 'Save' : 'Post'}
            </button>
          </div>
        </div>

        {contentLocked ? (
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-amber-700">{LISTING_LOCK_BANNER_TITLE}</p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{LISTING_LOCK_BANNER_BODY}</p>
          </div>
        ) : null}

        <div className="mt-5 flex gap-3 overflow-x-auto">
          {existingImages.map((url, idx) => (
            <div key={`ex-${idx}-${url.slice(0, 24)}`} className="relative w-40 h-52 rounded-3xl border border-(--border) overflow-hidden shrink-0">
              <img src={url} alt="product" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 text-[8px] font-bold uppercase text-white/90 drop-shadow">Saved</div>
              {!contentLocked ? (
                <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white inline-flex items-center justify-center">
                  <Trash2 size={12} />
                </button>
              ) : null}
            </div>
          ))}
          {previewUrls.map((url, idx) => (
            <div key={url} className="relative w-40 h-52 rounded-3xl border border-(--border) overflow-hidden shrink-0">
              <img src={url} alt="product" className="w-full h-full object-cover" />
              <button type="button" onClick={() => processAIBackground(idx)} disabled={isAIProcessing || loading || contentLocked} className="absolute top-2 left-2 h-7 rounded-lg bg-black/70 px-2 text-[10px] font-black text-white inline-flex items-center gap-1 disabled:opacity-50">
                <Wand2 size={11} /> AI CLEAN
              </button>
              {!contentLocked ? (
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white inline-flex items-center justify-center">
                  <Trash2 size={12} />
                </button>
              ) : null}
            </div>
          ))}
          {!contentLocked && imageTotal < LISTING_MAX_IMAGES ? (
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
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={contentLocked} className="mt-2 w-full h-12 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground) disabled:opacity-60" placeholder="Title of your item" />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">PRODUCT CATEGORY *</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map((cat) => {
                const selected = category === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      if (!contentLocked) setCategory(cat.slug);
                    }}
                    disabled={contentLocked}
                    className={`h-9 rounded-xl border px-3 text-[11px] font-black ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : 'border-(--border) bg-(--surface) text-(--muted)'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
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

          <button
            type="button"
            onClick={() => setRequiresShipping((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-left"
          >
            <div>
              <p className="text-[10px] font-black tracking-widest text-(--muted)">SHIPPING</p>
              <p className="mt-0.5 text-sm font-semibold text-(--foreground)">
                {requiresShipping ? 'Physical product — needs delivery' : 'Digital — no shipping'}
              </p>
            </div>
            <span
              className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 ${
                requiresShipping ? 'bg-emerald-600' : 'bg-(--border)'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition-transform ${
                  requiresShipping ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

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
                <button type="button" onClick={() => runAIDescription(false)} disabled={isGeneratingDesc || loading || contentLocked} className="h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 px-2 text-[10px] font-black text-violet-600 disabled:opacity-50">
                  {isGeneratingDesc ? 'AI...' : 'AI WRITE'}
                </button>
                <button type="button" onClick={() => runAIDescription(true)} disabled={isGeneratingDesc || loading || !description.trim() || contentLocked} className="h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 px-2 text-[10px] font-black text-violet-600 disabled:opacity-50">
                  REWRITE
                </button>
                <span className="text-[11px] text-(--muted)">{description.length}/500</span>
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              disabled={contentLocked}
              className="mt-2 w-full h-32 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--foreground) resize-none disabled:opacity-60"
              placeholder="Tell your customers about material, fit, usage..."
            />
            <p className="mt-1 text-xs text-(--muted)">Minimum 100 characters required.</p>
          </div>

          {contentLocked ? null : (
          <label className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-(--foreground)">
              <Sparkles size={14} className="text-violet-500" /> Auto-post to story
            </span>
            <input type="checkbox" checked={postToStory} onChange={(e) => setPostToStory(e.target.checked)} className="h-4 w-4 accent-violet-600" />
          </label>
          )}
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
      title={editId ? 'Product saved' : 'Product is live'}
      description={
        editId
          ? contentLocked
            ? 'Stock and price were updated. Title, photos, and description stay locked.'
            : 'Your product listing was updated.'
          : 'Your product is on your store. If you enabled auto-post to story, a 12-hour story was created too.'
      }
      tone="emerald"
      primaryAction={{ label: 'My profile', href: '/app/profile' }}
      secondaryAction={
        editId ? { label: 'Inventory', href: '/app/seller/inventory' } : { label: 'Post hub', href: '/app/post' }
      }
    />
    </>
  );
}

export default function AppSellerPostProductPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-(--muted)">Loading product studio…</div>}>
      <PostProductForm />
    </Suspense>
  );
}

