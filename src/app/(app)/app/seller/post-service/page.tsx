'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, ChevronRight, Plus, ShieldCheck, Trash2, Upload, Wand2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import { PostPublishResultSheet } from '@/components/seller/PostPublishResultSheet';
import { PostPublishingOverlay } from '@/components/seller/PostPublishingOverlay';
import { ServiceTrustPaymentSheet } from '@/components/seller/ServiceTrustPaymentSheet';
import {
  serviceCategoriesByGroup,
  canonicalizeServiceCategorySlug,
  isPickerServiceCategorySlug,
  productLeafForServiceCategory,
  serviceCategorySupportsMenuDuration,
  serviceCategorySupportsAvailability,
} from '@/constants/ServiceCategories';
import { getVerticalFulfillmentCopy, travelFeeLabels } from '@/lib/verticalFulfillmentCopy';
import {
  parseAvailabilitySettings,
  WEEKDAY_LABELS,
  type WeekdayIndex,
} from '@/lib/foodAvailability';
import {
  LISTING_LOCK_BANNER_BODY,
  LISTING_LOCK_BANNER_TITLE,
  isListingContentLocked,
  mapListingLockError,
} from '@/lib/listingContentLock';
import {
  depositConfigFromListing,
  depositListingFieldsFromConfig,
  isDepositConfigValid,
  type DepositMode,
} from '@/lib/depositPaymentHolds';
import { trustPaymentSummaryLine } from '@/lib/serviceTrustPaymentCopy';
import { LISTING_MAX_IMAGES } from '@/constants/listingMedia';

type MenuRow = { id: string; name: string; price: string; durationMinutes?: string };
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

function mediaUrlsFromRow(m: unknown): string[] {
  if (!m || !Array.isArray(m)) return [];
  return m
    .map((x) => (typeof x === 'string' ? x : (x as { url?: string })?.url))
    .filter((u): u is string => Boolean(u));
}

function PostServiceForm() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const editId = (searchParams.get('id') || '').trim() || null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [menuRows, setMenuRows] = useState<MenuRow[]>([{ id: 'row-1', name: '', price: '' }]);
  const [deliveryType, setDeliveryType] = useState<'in_person' | 'online' | 'both'>('in_person');
  const [locationType, setLocationType] = useState<'at_my_place' | 'i_travel' | 'both' | ''>('at_my_place');
  const [serviceAreasInput, setServiceAreasInput] = useState('');
  const [travelFeeMajor, setTravelFeeMajor] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [depositPolicy, setDepositPolicy] = useState('');
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositMode, setDepositMode] = useState<DepositMode>('percent');
  const [depositPercentInput, setDepositPercentInput] = useState('30');
  const [depositFixedMajor, setDepositFixedMajor] = useState('');
  const [trustPaymentOpen, setTrustPaymentOpen] = useState(false);
  const [maxJobsPerDay, setMaxJobsPerDay] = useState('');
  const [availWeekdays, setAvailWeekdays] = useState<WeekdayIndex[]>([1, 2, 3, 4, 5, 6]);
  const [windowStart, setWindowStart] = useState('09:00');
  const [windowEnd, setWindowEnd] = useState('18:00');
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
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
  const [serverMedia, setServerMedia] = useState<string[]>([]);
  const [loadEdit, setLoadEdit] = useState(!!editId);
  const [contentLockedAt, setContentLockedAt] = useState<string | null>(null);
  const contentLocked = isListingContentLocked({ content_locked_at: contentLockedAt });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!active || !userId) return;
      const { data: profile } = await supabase.from('profiles').select('subscription_plan, service_category').eq('id', userId).maybeSingle();
      if (!active) return;
      setIsDiamond(String(profile?.subscription_plan || '').toLowerCase() === 'diamond');
      if (!editId) {
        const fromProfile = canonicalizeServiceCategorySlug(profile?.service_category);
        if (isPickerServiceCategorySlug(fromProfile)) setServiceCategory(fromProfile);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, editId]);

  useEffect(() => {
    if (!editId) {
      setServerMedia([]);
      setContentLockedAt(null);
      setLoadEdit(false);
      return;
    }
    let a = true;
    (async () => {
      setLoadEdit(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          if (a) {
            setError('Please login again.');
            setLoadEdit(false);
          }
          return;
        }
        const { data, error: loadErr } = await supabase
          .from('service_listings')
          .select('*')
          .eq('id', editId)
          .eq('seller_id', userId)
          .single();
        if (!a) return;
        if (loadErr || !data) {
          setError('Could not load this listing for editing.');
          setLoadEdit(false);
          return;
        }
        const row = data as {
          title?: string;
          description?: string;
          media?: unknown;
          menu?: { name?: string; price_minor?: number; duration_minutes?: number }[] | null;
          delivery_type?: 'in_person' | 'online' | 'both';
          location_type?: 'at_my_place' | 'i_travel' | 'both' | null;
          service_areas?: string[] | null;
          is_active?: boolean;
          service_category?: string | null;
          content_locked_at?: string | null;
          travel_fee_minor?: number | null;
          cancellation_policy?: string | null;
          deposit_policy?: string | null;
          deposit_enabled?: boolean | null;
          deposit_mode?: string | null;
          deposit_percent?: number | string | null;
          deposit_minor?: number | null;
          availability_settings?: unknown;
        };
        setTitle(String(row.title || ''));
        setDescription(String(row.description || ''));
        setServiceCategory(canonicalizeServiceCategorySlug(row.service_category));
        if (row.delivery_type) setDeliveryType(row.delivery_type);
        if (row.location_type != null) setLocationType(row.location_type);
        if (row.is_active != null) setIsActive(!!row.is_active);
        setContentLockedAt(row.content_locked_at ?? null);
        {
          const travelMinor = Number(row.travel_fee_minor) || 0;
          setTravelFeeMajor(travelMinor > 0 ? String(Math.round(travelMinor / 100)) : '');
        }
        setCancellationPolicy(String(row.cancellation_policy || ''));
        setDepositPolicy(String(row.deposit_policy || ''));
        {
          const cfg = depositConfigFromListing(row);
          setDepositEnabled(!!cfg.enabled);
          if (cfg.mode === 'fixed' || cfg.mode === 'percent') setDepositMode(cfg.mode);
          if (cfg.mode === 'percent' && cfg.percent != null) {
            setDepositPercentInput(String(cfg.percent));
          }
          if (cfg.mode === 'fixed' && cfg.fixedMinor != null && cfg.fixedMinor > 0) {
            setDepositFixedMajor(String(Math.round(cfg.fixedMinor / 100)));
          }
        }
        {
          const parsedAvail = parseAvailabilitySettings(row.availability_settings);
          if (parsedAvail?.max_jobs_per_day) setMaxJobsPerDay(String(parsedAvail.max_jobs_per_day));
          else setMaxJobsPerDay('');
          if (parsedAvail?.weekdays?.length) setAvailWeekdays(parsedAvail.weekdays);
          if (parsedAvail?.window_start) setWindowStart(parsedAvail.window_start);
          if (parsedAvail?.window_end) setWindowEnd(parsedAvail.window_end);
          setBlackoutDates(Array.isArray(parsedAvail?.blackout_dates) ? [...parsedAvail.blackout_dates] : []);
        }
        setServiceAreasInput(
          Array.isArray(row.service_areas) ? row.service_areas.join(', ') : '',
        );
        setServerMedia(mediaUrlsFromRow(row.media));
        if (row.menu && Array.isArray(row.menu) && row.menu.length) {
          setMenuRows(
            row.menu.map((x, i) => ({
              id: `row-${i}`,
              name: String(x.name || '').trim(),
              price: x.price_minor != null ? String(Math.round(Number(x.price_minor) / 100)) : '',
              durationMinutes:
                x.duration_minutes != null && Number(x.duration_minutes) > 0
                  ? String(Math.floor(Number(x.duration_minutes)))
                  : '',
            })),
          );
        } else {
          setMenuRows([{ id: 'row-1', name: '', price: '', durationMinutes: '' }]);
        }
        setFiles([]);
        setPreviewUrls([]);
        setLoadEdit(false);
      } catch (e) {
        if (a) {
          setError('Failed to load listing.');
          setLoadEdit(false);
        }
      }
    })();
    return () => {
      a = false;
    };
  }, [editId, supabase]);

  const openDiamondSheet = (feature: string) => {
    setDiamondFeatureLabel(feature);
    setDiamondSheetOpen(true);
  };

  const onPickImages = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (contentLocked) return;
    const room = LISTING_MAX_IMAGES - serverMedia.length - files.length;
    const picked = Array.from(ev.target.files || []).slice(0, Math.max(0, room));
    if (!picked.length) return;
    setIsOptimizing(true);
    try {
      const optimized: File[] = [];
      for (const file of picked) optimized.push(await optimizeImageForUpload(file));
      setFiles((prev) => [...prev, ...optimized]);
      setPreviewUrls((prev) => [...prev, ...optimized.map((f) => URL.createObjectURL(f))]);
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (displayIdx: number) => {
    if (displayIdx < serverMedia.length) {
      setServerMedia((prev) => prev.filter((_, i) => i !== displayIdx));
    } else {
      const j = displayIdx - serverMedia.length;
      setFiles((prev) => prev.filter((_, i) => i !== j));
      setPreviewUrls((prev) => prev.filter((_, i) => i !== j));
    }
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

  const processAIBackground = async (displayIdx: number) => {
    if (!isDiamond) {
      openDiamondSheet('AI background clean');
      return;
    }
    if (displayIdx < serverMedia.length) {
      return;
    }
    const j = displayIdx - serverMedia.length;
    const file = files[j];
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
      setFiles((prev) => prev.map((f, i) => (i === j ? optimized : f)));
      const nextPreview = URL.createObjectURL(optimized);
      setPreviewUrls((prev) => prev.map((u, i) => (i === j ? nextPreview : u)));
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
    setMenuRows((prev) => [...prev, { id: `row-${prev.length + 1}`, name: '', price: '', durationMinutes: '' }]);
  };

  const removeRow = (id: string) => {
    setMenuRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const buildAvailabilitySettings = () => {
    if (!serviceCategorySupportsAvailability(serviceCategory)) return null;
    const max = Number(String(maxJobsPerDay).replace(/[^\d]/g, '')) || 0;
    const settings: Record<string, unknown> = {
      ...(max > 0 ? { max_jobs_per_day: max } : {}),
      ...(availWeekdays.length ? { weekdays: availWeekdays } : {}),
      window_start: windowStart,
      window_end: windowEnd,
      ...(blackoutDates.length ? { blackout_dates: [...blackoutDates].sort() } : {}),
    };
    return Object.keys(settings).length ? settings : null;
  };

  const uploadFile = async (userId: string, file: File, index: number) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/service_${Date.now()}_${index}.${ext}`;
    return uploadFileToR2(file, `service-images/${path}`);
  };

  const handleSubmit = async () => {
    setError(null);
    setResultSheetOpen(false);
    if (editId && contentLocked) {
      setLoading(true);
      setPublishStage('finalizing');
      setPublishProgress(70);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error('Please login again.');
        const offersTravel =
          deliveryType !== 'online' &&
          (locationType === 'i_travel' || locationType === 'both') &&
          canonicalizeServiceCategorySlug(serviceCategory) !== 'catering';
        const availability_settings = buildAvailabilitySettings();
        const depositFields = depositListingFieldsFromConfig({
          enabled: depositEnabled,
          mode: depositMode,
          percent: Number(depositPercentInput) || null,
          fixedMinor: Math.max(
            0,
            Math.floor(Number(String(depositFixedMajor).replace(/[^\d.]/g, '')) || 0) * 100,
          ),
        });
        if (
          depositEnabled &&
          !isDepositConfigValid({
            enabled: true,
            mode: depositMode,
            percent: Number(depositPercentInput) || null,
            fixedMinor: depositFields.deposit_minor,
          })
        ) {
          setError('Deposit incomplete: set a percent (1–90) or a fixed amount greater than 0.');
          setLoading(false);
          setPublishStage(null);
          return;
        }
        const { error: updateError } = await supabase
          .from('service_listings')
          .update({
            is_active: isActive,
            travel_fee_minor: offersTravel
              ? Math.max(0, Math.floor(Number(String(travelFeeMajor).replace(/[^\d.]/g, '')) || 0) * 100)
              : 0,
            cancellation_policy: cancellationPolicy.trim()
              ? cancellationPolicy.trim().slice(0, 500)
              : null,
            deposit_policy: depositPolicy.trim() ? depositPolicy.trim().slice(0, 500) : null,
            ...depositFields,
            ...(availability_settings
              ? { availability_settings }
              : serviceCategorySupportsAvailability(serviceCategory)
                ? { availability_settings: null }
                : {}),
          })
          .eq('id', editId)
          .eq('seller_id', userId);
        if (updateError) throw new Error(mapListingLockError(updateError.message));
        setPublishProgress(100);
        setResultSheetOpen(true);
      } catch (e: any) {
        setError(mapListingLockError(e?.message || 'Failed to update service.'));
      } finally {
        setLoading(false);
        setPublishStage(null);
        setPublishProgress(0);
      }
      return;
    }

    const menu = menuRows
      .map((r) => ({
        name: r.name.trim(),
        price: Number(r.price.replace(/[^\d]/g, '')),
        durationMinutes: Number(String(r.durationMinutes || '').replace(/[^\d]/g, '')) || 0,
      }))
      .filter((r) => r.name && r.price > 0);
    if (!title.trim() || menu.length === 0) {
      setError('Add service title and at least one menu option with valid price.');
      return;
    }
    if (!isPickerServiceCategorySlug(serviceCategory)) {
      setError('Choose a service category for this listing.');
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
      const uploaded: string[] = [];
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
      const finalMedia = editId ? [...serverMedia, ...uploaded] : uploaded;

      const basePayload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        hero_price_min: heroPriceMinor,
        currency_code: profile?.currency_code || 'NGN',
        delivery_type: deliveryType,
        location_type: deliveryType === 'online' ? null : locationType || null,
        service_areas: serviceAreas.length ? serviceAreas : null,
        media: finalMedia,
        is_active: isActive,
        menu: menu.map((m) => ({
          name: m.name,
          price_minor: m.price * 100,
          ...(serviceCategorySupportsMenuDuration(serviceCategory) && m.durationMinutes > 0
            ? { duration_minutes: Math.floor(m.durationMinutes) }
            : {}),
        })),
        travel_fee_minor:
          deliveryType !== 'online' &&
          (locationType === 'i_travel' || locationType === 'both') &&
          canonicalizeServiceCategorySlug(serviceCategory) !== 'catering'
            ? Math.max(0, Math.floor(Number(String(travelFeeMajor).replace(/[^\d.]/g, '')) || 0) * 100)
            : 0,
        cancellation_policy: cancellationPolicy.trim()
          ? cancellationPolicy.trim().slice(0, 500)
          : null,
        deposit_policy: depositPolicy.trim() ? depositPolicy.trim().slice(0, 500) : null,
        ...depositListingFieldsFromConfig({
          enabled: depositEnabled,
          mode: depositMode,
          percent: Number(depositPercentInput) || null,
          fixedMinor: Math.max(
            0,
            Math.floor(Number(String(depositFixedMajor).replace(/[^\d.]/g, '')) || 0) * 100,
          ),
        }),
      };
      if (
        depositEnabled &&
        !isDepositConfigValid({
          enabled: true,
          mode: depositMode,
          percent: Number(depositPercentInput) || null,
          fixedMinor: Math.max(
            0,
            Math.floor(Number(String(depositFixedMajor).replace(/[^\d.]/g, '')) || 0) * 100,
          ),
        })
      ) {
        setError('Deposit incomplete: set a percent (1–90) or a fixed amount greater than 0.');
        setLoading(false);
        setPublishStage(null);
        return;
      }
      const availability_settings = buildAvailabilitySettings();
      if (availability_settings) basePayload.availability_settings = availability_settings;
      else if (serviceCategorySupportsAvailability(serviceCategory)) {
        basePayload.availability_settings = null;
      }
      if (!editId) {
        basePayload.service_category = canonicalizeServiceCategorySlug(serviceCategory);
        basePayload.location_country_code = profile?.location_country_code || 'NG';
      }
      if (profile?.service_latitude != null && profile?.service_longitude != null) {
        basePayload.latitude = profile.service_latitude;
        basePayload.longitude = profile.service_longitude;
        basePayload.service_address = profile.location || null;
      }
      if (editId) {
        const { error: updateError } = await supabase
          .from('service_listings')
          .update(basePayload)
          .eq('id', editId)
          .eq('seller_id', userId);
        if (updateError) throw new Error(mapListingLockError(updateError.message));
        setServerMedia((prev) => [...prev, ...uploaded]);
        setFiles([]);
        setPreviewUrls([]);
      } else {
        const payload: Record<string, unknown> = { ...basePayload, seller_id: userId };
        const { error: createError } = await supabase.from('service_listings').insert(payload);
        if (createError) throw createError;
        setTitle('');
        setDescription('');
        setMenuRows([{ id: 'row-1', name: '', price: '' }]);
        setDeliveryType('in_person');
        setLocationType('at_my_place');
        setServiceAreasInput('');
        setIsActive(true);
        setServerMedia([]);
        setFiles([]);
        setPreviewUrls([]);
      }
      setPublishProgress(100);
      setResultSheetOpen(true);
    } catch (e: any) {
      setError(mapListingLockError(e?.message || (editId ? 'Failed to update service.' : 'Failed to post service.')));
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

  const imageTotal = serverMedia.length + files.length;
  if (loadEdit) {
    return <div className="py-24 text-center text-sm text-(--muted)">Loading listing…</div>;
  }

  return (
    <>
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-(--border) bg-(--card) p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Service Studio</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-(--foreground)">
              {editId ? 'Edit service' : 'Post Service'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={editId ? '/app/seller/inventory' : '/app/post'} className="inline-flex h-10 items-center rounded-xl border border-(--border) px-3 text-xs font-black text-(--foreground)">
              <ArrowLeft size={14} className="mr-1" /> Back
            </Link>
            <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-600 text-white text-sm font-black disabled:opacity-50">
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
          {serverMedia.map((url, sidx) => (
            <div key={`srv-${sidx}-${url.slice(0, 20)}`} className="relative w-40 h-52 rounded-3xl border border-(--border) overflow-hidden shrink-0">
              <img src={url} alt="service" className="h-full w-full object-cover" />
              <div className="absolute top-2 left-2 text-[8px] font-bold uppercase text-white/90 drop-shadow">Saved</div>
              <button
                type="button"
                onClick={() => processAIBackground(sidx)}
                disabled
                className="absolute top-2 left-12 inline-flex items-center gap-1 bg-black/30 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-50 cursor-not-allowed"
              >
                <Wand2 size={10} /> AI
              </button>
              <button
                type="button"
                onClick={() => removeImage(sidx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white inline-flex items-center justify-center"
                aria-label="Remove image"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {files.map((_, fidx) => {
            const dIdx = serverMedia.length + fidx;
            const u = previewUrls[fidx] || '';
            return (
            <div key={`new-${fidx}`} className="relative w-40 h-52 rounded-3xl border border-(--border) overflow-hidden shrink-0">
              <img src={u} alt="service" className="h-full w-full object-cover" />
              <button type="button" onClick={() => void processAIBackground(dIdx)} disabled={isAIProcessing || loading} className="absolute top-2 left-2 inline-flex items-center gap-1 bg-black/65 text-white text-[10px] font-black px-2 py-1 rounded-lg disabled:opacity-50">
                <Wand2 size={10} /> AI CLEAN
              </button>
              <button type="button" onClick={() => removeImage(dIdx)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white inline-flex items-center justify-center" aria-label="Remove image">
                <Trash2 size={12} />
              </button>
            </div>
            );
          })}
          {imageTotal < LISTING_MAX_IMAGES ? (
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={contentLocked} className="mt-2 w-full h-12 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground) disabled:opacity-60" placeholder="e.g. Luxury Gel Nails" />
          </div>

          <div>
            <label className="text-xs font-black tracking-widest text-(--muted)">SERVICE CATEGORY *</label>
            <div className="mt-2 space-y-3">
              {serviceCategoriesByGroup().map(({ group, label, items }) => (
                <div key={group}>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-(--muted)">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((svc) => {
                      const selected = serviceCategory === svc.slug;
                      return (
                        <button
                          key={svc.slug}
                          type="button"
                          onClick={() => {
                            if (!contentLocked) setServiceCategory(svc.slug);
                          }}
                          disabled={contentLocked}
                          className={`h-9 rounded-xl border px-3 text-[11px] font-black ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'border-(--border) bg-(--surface) text-(--muted)'
                          }`}
                        >
                          {svc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              disabled={contentLocked}
              className="mt-2 w-full h-28 rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-medium text-(--foreground) resize-none disabled:opacity-60"
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
                <div key={row.id} className="space-y-2">
                  <div className="grid grid-cols-[1fr_120px_28px] gap-2 items-center">
                    <input
                      value={row.name}
                      onChange={(e) => updateRow(row.id, { name: e.target.value })}
                      disabled={contentLocked}
                      className="h-11 rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground) disabled:opacity-60"
                      placeholder="Menu option"
                    />
                    <input
                      value={row.price}
                      onChange={(e) => updateRow(row.id, { price: e.target.value.replace(/[^\d]/g, '') })}
                      disabled={contentLocked}
                      className="h-11 rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-black text-emerald-600 disabled:opacity-60"
                      placeholder="₦0"
                    />
                    <button type="button" onClick={() => removeRow(row.id)} disabled={contentLocked} className="h-7 w-7 rounded-full text-(--muted) hover:bg-(--surface) disabled:opacity-40">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {serviceCategorySupportsMenuDuration(serviceCategory) ? (
                    <input
                      value={row.durationMinutes || ''}
                      onChange={(e) =>
                        updateRow(row.id, { durationMinutes: e.target.value.replace(/[^\d]/g, '') })
                      }
                      disabled={contentLocked}
                      inputMode="numeric"
                      className="h-10 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground) disabled:opacity-60"
                      placeholder={
                        productLeafForServiceCategory(serviceCategory) === 'fashion'
                          ? 'Turnaround mins (e.g. 120)'
                          : productLeafForServiceCategory(serviceCategory) === 'real-estate'
                            ? 'Viewing mins (e.g. 45)'
                            : productLeafForServiceCategory(serviceCategory) === 'wellness'
                              ? 'Session mins (e.g. 60)'
                          : productLeafForServiceCategory(serviceCategory) === 'automotive'
                            ? 'Service mins (e.g. 60)'
                            : productLeafForServiceCategory(serviceCategory) === 'home'
                              ? 'Job mins (e.g. 60)'
                              : productLeafForServiceCategory(serviceCategory) === 'electronics'
                                ? 'Repair mins (e.g. 60)'
                                : productLeafForServiceCategory(serviceCategory) === 'events'
                                  ? 'Coverage mins (e.g. 240)'
                                  : 'Duration mins (e.g. 45)'
                  }
                    />
                  ) : null}
                </div>
              ))}
              <button type="button" onClick={addRow} disabled={contentLocked} className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-(--border) bg-(--surface) text-xs font-black text-(--muted) disabled:opacity-40">
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
                  {(() => {
                    const locCopy = getVerticalFulfillmentCopy(serviceCategory);
                    return [
                      { key: 'at_my_place' as const, label: locCopy.sellerAtMyPlace },
                      { key: 'i_travel' as const, label: locCopy.sellerITravel },
                      { key: 'both' as const, label: locCopy.sellerBoth },
                    ];
                  })().map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setLocationType(opt.key)}
                      className={`h-10 rounded-xl border text-xs font-black ${locationType === opt.key ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-(--border) bg-(--surface) text-(--muted)'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {serviceCategory ? (
                  <p className="mt-2 text-xs text-(--muted)">
                    {getVerticalFulfillmentCopy(serviceCategory).sellerLocationHelp}
                  </p>
                ) : null}
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
              {(locationType === 'i_travel' || locationType === 'both') &&
              canonicalizeServiceCategorySlug(serviceCategory) !== 'catering' ? (
                <div>
                  <label className="text-xs font-black tracking-widest text-(--muted)">
                    {travelFeeLabels(serviceCategory).sellerSection}
                  </label>
                  <p className="mt-1 text-xs text-(--muted)">
                    {travelFeeLabels(serviceCategory).sellerHint}
                  </p>
                  <input
                    value={travelFeeMajor}
                    onChange={(e) => setTravelFeeMajor(e.target.value.replace(/[^\d.]/g, ''))}
                    inputMode="decimal"
                    className="mt-2 w-full h-11 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)"
                    placeholder="Amount"
                  />
                </div>
              ) : null}
            </>
          )}

          {serviceCategorySupportsAvailability(serviceCategory) ? (
            <div>
              <label className="text-xs font-black tracking-widest text-(--muted)">
                AVAILABILITY & CAPACITY
              </label>
              <p className="mt-1 text-xs text-(--muted)">
                {productLeafForServiceCategory(serviceCategory) === 'fashion'
                  ? 'Buyers see when you can take fittings. You still confirm each booking.'
                  : productLeafForServiceCategory(serviceCategory) === 'real-estate'
                    ? 'Buyers see when you can take viewings. You still confirm each booking.'
                    : productLeafForServiceCategory(serviceCategory) === 'wellness'
                      ? 'Buyers see when you can take sessions. You still confirm each booking.'
                      : productLeafForServiceCategory(serviceCategory) === 'automotive'
                        ? 'Buyers see when you can take jobs. You still confirm each booking.'
                        : productLeafForServiceCategory(serviceCategory) === 'home'
                          ? 'Buyers see when you can take jobs. You still confirm each booking.'
                          : productLeafForServiceCategory(serviceCategory) === 'electronics'
                            ? 'Buyers see when you can take repairs. You still confirm each booking.'
                            : productLeafForServiceCategory(serviceCategory) === 'events'
                              ? 'Buyers see when you can take events. You still confirm each booking.'
                              : canonicalizeServiceCategorySlug(serviceCategory) === 'catering'
                            ? 'Buyers see when you can take orders. You still confirm each booking.'
                            : 'Buyers see when you can take appointments. You still confirm each booking.'}
              </p>
              <input
                value={maxJobsPerDay}
                onChange={(e) => setMaxJobsPerDay(e.target.value.replace(/[^\d]/g, ''))}
                inputMode="numeric"
                className="mt-2 w-full h-11 rounded-xl border border-(--border) bg-(--surface) px-4 text-sm font-semibold text-(--foreground)"
                placeholder={
                  productLeafForServiceCategory(serviceCategory) === 'wellness'
                    ? 'Max sessions per day (e.g. 3)'
                    : productLeafForServiceCategory(serviceCategory) === 'fashion'
                      ? 'Max fittings per day (e.g. 3)'
                      : productLeafForServiceCategory(serviceCategory) === 'real-estate'
                        ? 'Max viewings per day (e.g. 3)'
                        : canonicalizeServiceCategorySlug(serviceCategory) === 'catering'
                          ? 'Max orders per day (e.g. 3)'
                          : productLeafForServiceCategory(serviceCategory) === 'electronics'
                            ? 'Max repairs per day (e.g. 5)'
                            : productLeafForServiceCategory(serviceCategory) === 'events'
                              ? 'Max events per day (e.g. 2)'
                              : 'Max jobs per day (e.g. 3)'
                }
              />
              <p className="mt-3 text-[10px] font-black tracking-widest text-(--muted)">DAYS OPEN</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((d) => {
                  const on = availWeekdays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() =>
                        setAvailWeekdays((prev) =>
                          on ? prev.filter((x) => x !== d.key) : [...prev, d.key].sort(),
                        )
                      }
                      className={`h-9 rounded-full border px-3 text-xs font-black ${
                        on
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700'
                          : 'border-(--border) bg-(--surface) text-(--muted)'
                      }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                  className="h-11 rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground)"
                  placeholder="Start HH:mm"
                />
                <input
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                  className="h-11 rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--foreground)"
                  placeholder="End HH:mm"
                />
              </div>
              <p className="mt-3 text-[10px] font-black tracking-widest text-(--muted)">CLOSED DATES</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {blackoutDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setBlackoutDates((prev) => prev.filter((x) => x !== d))}
                    className="h-9 rounded-full border border-(--border) bg-(--surface) px-3 text-xs font-bold text-(--foreground)"
                  >
                    {d} ×
                  </button>
                ))}
                <input
                  type="date"
                  className="h-9 rounded-full border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 text-xs font-black text-emerald-700"
                  onChange={(e) => {
                    const iso = e.target.value;
                    if (!iso) return;
                    setBlackoutDates((prev) => (prev.includes(iso) ? prev : [...prev, iso].sort()));
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setTrustPaymentOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-(--muted)" />
                <span className="text-sm font-bold text-(--foreground)">Trust & payment</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-(--muted)">
                {trustPaymentSummaryLine({
                  cancellationPolicy,
                  depositEnabled,
                  depositMode,
                  depositPercentInput,
                  depositFixedMajor,
                  depositPolicy,
                })}
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-(--muted)" />
          </button>

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
      <ServiceTrustPaymentSheet
        open={trustPaymentOpen}
        onClose={() => setTrustPaymentOpen(false)}
        serviceCategory={serviceCategory}
        contentLocked={contentLocked}
        cancellationPolicy={cancellationPolicy}
        onCancellationPolicyChange={setCancellationPolicy}
        depositEnabled={depositEnabled}
        onDepositEnabledChange={setDepositEnabled}
        depositMode={depositMode}
        onDepositModeChange={setDepositMode}
        depositPercentInput={depositPercentInput}
        onDepositPercentChange={setDepositPercentInput}
        depositFixedMajor={depositFixedMajor}
        onDepositFixedChange={setDepositFixedMajor}
        depositPolicy={depositPolicy}
        onDepositPolicyChange={setDepositPolicy}
      />
    </div>
    <PostPublishingOverlay
      open={loading}
      label={editId ? 'Saving service' : 'Publishing service'}
      progress={publishProgress}
      stage={publishStage}
      tone="emerald"
    />
    <PostPublishResultSheet
      open={resultSheetOpen}
      onClose={() => setResultSheetOpen(false)}
      title={editId ? 'Service updated' : 'Service is live'}
      description={
        editId
          ? 'Your service listing was saved. Buyers will see the latest when it is active.'
          : 'Your service listing is published and visible to buyers when active.'
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

export default function AppSellerPostServicePage() {
  return (
    <Suspense
      fallback={<div className="py-24 text-center text-sm text-(--muted)">Loading service studio…</div>}
    >
      <PostServiceForm />
    </Suspense>
  );
}
