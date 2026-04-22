'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, Plus, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';

type MenuRow = { id: string; name: string; price: string };
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

export default function AppSellerPostServicePage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [menuRows, setMenuRows] = useState<MenuRow[]>([{ id: 'row-1', name: '', price: '' }]);
  const [deliveryType, setDeliveryType] = useState<'in_person' | 'online' | 'both'>('in_person');
  const [locationType, setLocationType] = useState<'at_my_place' | 'i_travel' | 'both' | ''>('at_my_place');
  const [serviceAreasInput, setServiceAreasInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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

  const openDiamondSheet = (feature: string) => {
    setDiamondFeatureLabel(feature);
    setDiamondSheetOpen(true);
  };

  const onPickImages = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(ev.target.files || []).slice(0, Math.max(0, 4 - files.length));
    if (!picked.length) return;
    setIsOptimizing(true);
    try {
      const optimized = [];
      for (const file of picked) optimized.push(await optimizeImageForUpload(file));
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

  const runAIDescription = async (isRewrite: boolean) => {
    if (!isDiamond) {
      openDiamondSheet('AI service writer');
      return;
    }
    if (!title.trim()) {
      setError('Enter a service title first.');
      return;
    }
    setError(null);
    setIsGeneratingDesc(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-description', {
        body: {
          productName: `Service Booking: ${title.trim()}`,
          style: descriptionStyle,
          isRewrite,
          currentDescription: isRewrite ? description : undefined,
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
      const { data, error: invokeError } = await supabase.functions.invoke('remove-background', { body: { image_b64: base64 } });
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

  const updateRow = (id: string, patch: Partial<MenuRow>) => {
    setMenuRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setMenuRows((prev) => [...prev, { id: `row-${prev.length + 1}`, name: '', price: '' }]);
  };

  const removeRow = (id: string) => {
    setMenuRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const uploadFile = async (userId: string, file: File, index: number) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/service_${Date.now()}_${index}.${ext}`;
    const { error } = await supabase.storage.from('service-images').upload(path, file, {
      contentType: file.type || `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('service-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setError(null);
    setResultSheetOpen(false);
    const menu = menuRows
      .map((r) => ({ name: r.name.trim(), price: Number(r.price.replace(/[^\d]/g, '')) }))
      .filter((r) => r.name && r.price > 0);
    if (!title.trim() || menu.length === 0) {
      setError('Add service title and at least one menu option with valid price.');
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
        .select('is_seller,is_verified,onboarding_completed,bank_details,currency_code,location_country_code,service_category,seller_type,service_latitude,service_longitude,location,subscription_plan')
        .eq('id', userId)
        .maybeSingle();
      setIsDiamond(String(profile?.subscription_plan || '').toLowerCase() === 'diamond');
      if (!profile?.is_seller) throw new Error('Seller access required.');
      if (!profile?.is_verified || !profile?.onboarding_completed) throw new Error('Complete seller verification/onboarding before posting.');
      if (!profile?.bank_details?.recipient_code) throw new Error('Set up bank details before posting.');

      setPublishProgress(14);
      const uploaded = [];
      for (let i = 0; i < files.length; i += 1) {
        uploaded.push(await uploadFile(userId, files[i], i));
        setPublishProgress(14 + Math.round(((i + 1) / Math.max(1, files.length)) * 62));
      }
      setPublishStage('finalizing');
      setPublishProgress(88);
      const heroPriceMinor = Math.min(...menu.map((m) => m.price)) * 100;
      const serviceAreas = serviceAreasInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);

      const payload: any = {
        seller_id: userId,
        title: title.trim(),
        description: description.trim(),
        hero_price_min: heroPriceMinor,
        currency_code: profile?.currency_code || 'NGN',
        delivery_type: deliveryType,
        location_type: deliveryType === 'online' ? null : locationType || null,
        service_areas: serviceAreas.length ? serviceAreas : null,
        media: uploaded,
        is_active: isActive,
        menu: menu.map((m) => ({ name: m.name, price_minor: m.price * 100 })),
        service_category: profile?.service_category || 'nail_tech',
        location_country_code: profile?.location_country_code || 'NG',
      };
      if (profile?.service_latitude != null && profile?.service_longitude != null) {
        payload.latitude = profile.service_latitude;
        payload.longitude = profile.service_longitude;
        payload.service_address = profile.location || null;
      }
      const { error: createError } = await supabase.from('service_listings').insert(payload);
      if (createError) throw createError;
      setPublishProgress(100);
      setTitle('');
      setDescription('');
      setMenuRows([{ id: 'row-1', name: '', price: '' }]);
      setDeliveryType('in_person');
      setLocationType('at_my_place');
      setServiceAreasInput('');
      setIsActive(true);
      setFiles([]);
      setPreviewUrls([]);
      setResultSheetOpen(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to post service.');
    } finally {
      setLoading(false);
      setPublishStage(null);
      setPublishProgress(0);
    }
  };

  const minPrice = (() => {
    const prices = menuRows.map((r) => Number(r.price.replace(/[^\d]/g, ''))).filter((p) => p > 0);
    if (!prices.length) return null;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(Math.min(...prices));
  })();

  return (
    <>
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Service Studio</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-(--foreground)">Post Service</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/post" className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-600 text-white text-sm font-black disabled:opacity-50">
              {!loading ? <Upload size={14} /> : null}
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto">
          {previewUrls.map((url, idx) => (
            <div key={url} className="relative w-40 h-52 rounded-3xl border border-(--border) overflow-hidden shrink-0">
              <img src={url} alt="service" className="w-full h-full object-cover" />
              <button type="button" onClick={() => processAIBackground(idx)} disabled={isAIProcessing || loading} className="absolute top-2 left-2 inline-flex items-center gap-1 bg-black/65 text-white text-[10px] font-black px-2 py-1 rounded-lg disabled:opacity-50">
                <Wand2 size={10} /> AI CLEAN
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
            <label className="text-xs font-black tracking-widest text-(--muted)">SERVICE TITLE</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full h-12 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)" placeholder="e.g. Luxury Gel Nails" />
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
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              className="mt-2 w-full h-28 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--foreground) resize-none"
              placeholder="Tell buyers what you do, what’s included, and what to expect."
            />
            <p className="mt-1 text-xs text-(--muted)">{description.length}/500</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black tracking-widest text-(--muted)">MENU & PRICING</label>
              {minPrice ? <span className="text-xs font-black text-emerald-600">From {minPrice}</span> : null}
            </div>
            <div className="mt-2 space-y-2">
              {menuRows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_120px_28px] gap-2 items-center">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    className="h-11 rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground)"
                    placeholder="Menu option"
                  />
                  <input
                    value={row.price}
                    onChange={(e) => updateRow(row.id, { price: e.target.value.replace(/[^\d]/g, '') })}
                    className="h-11 rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-black text-emerald-600"
                    placeholder="₦0"
                  />
                  <button type="button" onClick={() => removeRow(row.id)} className="h-7 w-7 rounded-full text-(--muted) hover:bg-(--surface)">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addRow} className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-(--border) bg-(--surface) text-xs font-black text-(--muted)">
                <Plus size={12} /> Add option
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">DELIVERY TYPE</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['in_person', 'online', 'both'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeliveryType(type)}
                  className={`h-10 rounded-xl border text-xs font-black ${deliveryType === type ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-(--border) bg-(--surface) text-(--muted)'}`}
                >
                  {type === 'in_person' ? 'In person' : type === 'online' ? 'Online' : 'Both'}
                </button>
              ))}
            </div>
          </div>

          {(deliveryType === 'in_person' || deliveryType === 'both') && (
            <>
              <div>
                <label className="text-xs font-black tracking-widest text-(--muted)">IN-PERSON MODE</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['at_my_place', 'i_travel', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLocationType(type)}
                      className={`h-10 rounded-xl border text-xs font-black ${locationType === type ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-(--border) bg-(--surface) text-(--muted)'}`}
                    >
                      {type === 'at_my_place' ? 'At my place' : type === 'i_travel' ? 'I travel' : 'Both'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black tracking-widest text-(--muted)">SERVICE AREAS</label>
                <input
                  value={serviceAreasInput}
                  onChange={(e) => setServiceAreasInput(e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)"
                  placeholder="e.g. Lekki, Ikeja, Ajah"
                />
              </div>
            </>
          )}

          <label className="flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
            <span className="text-sm font-bold text-(--foreground)">Service is visible in your store</span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          </label>
          {isOptimizing ? <p className="text-xs font-semibold text-(--muted)">Optimizing selected images...</p> : null}
          {isDiamond ? <p className="text-xs font-semibold text-violet-600">Diamond service studio active</p> : <p className="text-xs font-semibold text-(--muted)">Standard listing active</p>}

          {error ? <p className="text-sm font-semibold text-red-500">{error}</p> : null}
        </div>
      </div>
      {diamondSheetOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-(--border) bg-(--card) p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">Diamond Exclusive</p>
            <h3 className="mt-2 text-xl font-black text-(--foreground)">Upgrade to continue</h3>
            <p className="mt-2 text-sm text-(--muted)">
              <span className="font-bold text-(--foreground)">{diamondFeatureLabel}</span> is available for Diamond sellers only. Upgrade now to unlock full service studio AI tools.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDiamondSheetOpen(false)} className="h-10 px-4 rounded-xl border border-(--border) text-sm font-bold text-(--foreground)">
                Not now
              </button>
              <Link href="/app/subscription" onClick={() => setDiamondSheetOpen(false)} className="inline-flex h-10 items-center rounded-xl bg-violet-600 px-4 text-sm font-black text-white">
                Upgrade to Diamond
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    <PostPublishingOverlay
      open={loading}
      label="Publishing service"
      progress={publishProgress}
      stage={publishStage}
      tone="emerald"
    />
    <PostPublishResultSheet
      open={resultSheetOpen}
      onClose={() => setResultSheetOpen(false)}
      title="Service is live"
      description="Your service listing is published and visible to buyers when active."
      tone="emerald"
      primaryAction={{ label: 'My profile', href: '/app/profile' }}
      secondaryAction={{ label: 'Post hub', href: '/app/post' }}
    />
    </>
  );
}

