'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Store, User } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { uploadFileToR2 } from '@/lib/mediaUpload';
import Button from '@/components/ui/Button';

const AVATAR_SIZE = 200;
const AVATAR_RADIUS = Math.round(AVATAR_SIZE * 0.3);
const BADGE_SIZE = 44;
const BADGE_RADIUS = Math.round(BADGE_SIZE * 0.3);

export default function OnboardingProfilePhotoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const previewUrl = localPreview || existingUrl;
  const hasPhoto = Boolean(previewUrl);
  const FallbackIcon = isSeller ? Store : User;

  const subtitle = useMemo(() => {
    if (hasPhoto) return 'Looking good. You can still change it.';
    return isSeller ? 'So buyers recognize your shop.' : 'So people know it’s you.';
  }, [hasPhoto, isSeller]);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        router.push('/auth/signup');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('logo_url, is_seller')
        .eq('id', session.session.user.id)
        .maybeSingle();
      setIsSeller(!!profile?.is_seller);
      setExistingUrl(typeof profile?.logo_url === 'string' && profile.logo_url.trim() ? profile.logo_url : null);
    };
    void load();
  }, [router]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const onPickFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError(null);
    setLocalFile(file);
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const finish = async (withPhoto: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        router.push('/auth/signup');
        return;
      }

      const payload: Record<string, unknown> = {
        onboarding_completed: true,
        onboarding_step: 'completed',
      };

      if (withPhoto && localFile) {
        const ext = (localFile.name.split('.').pop() || 'jpg').toLowerCase();
        const safeExt = ext === 'png' ? 'png' : 'jpg';
        const url = await uploadFileToR2(
          localFile,
          `profiles/${session.session.user.id}/logo_${Date.now()}.${safeExt}`,
          localFile.type || (safeExt === 'png' ? 'image/png' : 'image/jpeg'),
        );
        payload.logo_url = `${url}?t=${Date.now()}`;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', session.session.user.id);
      if (updateError) throw updateError;

      router.push('/app/home');
    } catch (err: any) {
      setError(err?.message || 'Couldn’t finish. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPrimary = () => {
    if (hasPhoto) {
      void finish(true);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative"
          aria-label="Add a profile photo"
        >
          <div
            className="overflow-hidden bg-(--muted)/20"
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_RADIUS,
            }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FallbackIcon size={84} className="text-(--muted)" strokeWidth={1.75} />
              </div>
            )}
          </div>
          <span
            className="absolute flex items-center justify-center border-[3px] border-(--background) bg-(--foreground) text-(--background)"
            style={{
              width: BADGE_SIZE,
              height: BADGE_SIZE,
              borderRadius: BADGE_RADIUS,
              right: 6,
              bottom: 6,
            }}
          >
            <Camera size={18} strokeWidth={2.4} />
          </span>
        </button>

        <h1 className="mt-6 text-2xl font-black tracking-tight sm:text-3xl">Add a profile photo</h1>
        <p className="mt-2 max-w-xs text-sm text-(--muted)">{subtitle}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPickFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {error ? <p className="mb-3 text-center text-sm text-red-500">{error}</p> : null}

      <div className="space-y-2">
        <Button onClick={onPrimary} disabled={loading} className="w-full">
          {loading ? 'Saving...' : hasPhoto ? 'Next' : 'Add photo'}
        </Button>
        <button
          type="button"
          onClick={() => void finish(false)}
          disabled={loading}
          className="w-full py-2 text-sm text-(--muted) disabled:opacity-50"
        >
          I&apos;ll do this later
        </button>
      </div>
    </div>
  );
}
