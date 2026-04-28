'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clapperboard, Play, ShoppingBag, User, Video, Wrench } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import type { ParsedStoreLink } from '@/lib/chatShareUtils';

type PreviewMeta = {
  title: string;
  imageUrl?: string | null;
  drawingOverlayUrl?: string | null;
};

function usePreviewMeta(parsed: ParsedStoreLink) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<{ data: PreviewMeta | null; loading: boolean }>({ data: null, loading: true });
  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ data: prev.data, loading: true }));
    const run = async () => {
      try {
        if (parsed.type === 'product') {
          const { data } = await supabase.from('products').select('name,image_urls').eq('slug', parsed.id).maybeSingle();
          if (!cancelled) setState({ data: data ? { title: data.name || 'Product', imageUrl: (data.image_urls as string[])?.[0] } : null, loading: false });
          return;
        }
        if (parsed.type === 'service') {
          const { data } = await supabase.from('service_listings').select('title,media').or(`id.eq.${parsed.id},slug.eq.${parsed.id}`).maybeSingle();
          const media = Array.isArray((data as { media?: unknown })?.media) ? ((data as { media?: unknown[] }).media as unknown[]) : [];
          const first = media[0] as { url?: string; media_url?: string; image_url?: string } | string | undefined;
          const imageUrl = typeof first === 'string' ? first : first?.url || first?.media_url || first?.image_url || null;
          if (!cancelled) setState({ data: data ? { title: (data as { title?: string }).title || 'Service', imageUrl } : null, loading: false });
          return;
        }
        if (parsed.type === 'reel') {
          const { data } = await supabase.from('reels').select('caption,thumbnail_url,drawing_overlay_url').or(`id.eq.${parsed.id},short_code.eq.${parsed.id}`).maybeSingle();
          if (!cancelled) {
            setState({
              data: data ? { title: data.caption || 'Reel', imageUrl: data.thumbnail_url || null, drawingOverlayUrl: data.drawing_overlay_url || null } : null,
              loading: false,
            });
          }
          return;
        }
        if (parsed.type === 'spotlight') {
          const { data } = await supabase.from('spotlight_posts').select('caption,thumbnail_url,drawing_overlay_url').eq('id', parsed.id).maybeSingle();
          if (!cancelled) {
            setState({
              data: data ? { title: data.caption || 'Spotlight', imageUrl: data.thumbnail_url || null, drawingOverlayUrl: data.drawing_overlay_url || null } : null,
              loading: false,
            });
          }
          return;
        }
        if (parsed.type === 'profile') {
          const { data } = await supabase.from('profiles').select('display_name,logo_url,avatar_url').ilike('slug', parsed.id).maybeSingle();
          if (!cancelled) setState({ data: data ? { title: data.display_name || `@${parsed.id}`, imageUrl: data.logo_url || data.avatar_url || null } : null, loading: false });
          return;
        }
        if (parsed.type === 'story') {
          const { data } = await supabase.from('stories').select('story_text,media_url').eq('id', parsed.id).maybeSingle();
          if (!cancelled) setState({ data: data ? { title: data.story_text || 'Story', imageUrl: data.media_url || null } : null, loading: false });
          return;
        }
      } catch {
        if (!cancelled) setState({ data: null, loading: false });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [parsed.id, parsed.type, supabase, setState]);
  return state;
}

function TypeIcon({ type }: { type: ParsedStoreLink['type'] }) {
  if (type === 'product') return <ShoppingBag size={16} className="text-(--muted)" />;
  if (type === 'reel') return <Video size={16} className="text-(--muted)" />;
  if (type === 'service') return <Wrench size={16} className="text-(--muted)" />;
  if (type === 'spotlight') return <Clapperboard size={16} className="text-(--muted)" />;
  return <User size={16} className="text-(--muted)" />;
}

export function ChatLinkPreviewCard({ parsed, onOpen }: { parsed: ParsedStoreLink; onOpen: () => void }) {
  const { data, loading } = usePreviewMeta(parsed);
  const imageUrl = normalizeWebMediaUrl(data?.imageUrl || '');
  const typeLabel =
    parsed.type === 'product'
      ? 'View product'
      : parsed.type === 'service'
        ? 'View service'
        : parsed.type === 'reel'
          ? 'Watch reel'
          : parsed.type === 'spotlight'
            ? 'Watch spotlight'
            : parsed.type === 'story'
              ? 'View story'
              : 'View profile';
  const showPlay = parsed.type === 'reel' || parsed.type === 'spotlight' || parsed.type === 'story';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-1 flex w-full max-w-[300px] items-center gap-2 rounded-xl border border-(--border) bg-(--card) p-1.5 text-left"
    >
      <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-(--surface)">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TypeIcon type={parsed.type} />
          </div>
        )}
        {showPlay ? (
          <span className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
            <Play size={10} className="ml-0.5 fill-white" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--foreground)">{loading ? 'Loading…' : data?.title || 'Shared item'}</p>
        <p className="mt-0.5 truncate text-xs text-(--muted)">{typeLabel}</p>
      </div>
    </button>
  );
}
