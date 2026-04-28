'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Heart, MessageCircle, Play, Share2, Smartphone, Volume2, VolumeX } from 'lucide-react';
import Button from '@/components/ui/Button';
import { normalizeWebMediaUrl } from '@/lib/media-url';
import { createBrowserClient } from '@/lib/supabase';
import { ensureAuthAction } from '@/lib/guestActionPrompt';

type SpotlightDetailProps = {
  post: Record<string, any>;
  backHref: string;
};

export default function WebSpotlightDetail({ post, backHref }: SpotlightDetailProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [pendingLike, setPendingLike] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const thumbSrc = normalizeWebMediaUrl(post.thumbnail_url || post.media_url);
  const videoSrc = useMemo(() => normalizeWebMediaUrl(post.media_url), [post.media_url]);
  const creator = post.creator || {};
  const postId = String(post.id || '').trim();

  const promptAuth = (action: string) => {
    return ensureAuthAction({
      viewerId,
      nextPath: pathname || `/sp/${post.id}`,
      action,
    });
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setViewerId(data.user?.id ?? null);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const syncEngagement = useCallback(async () => {
    if (!postId) return;
    const [{ count }, likedRes] = await Promise.all([
      supabase.from('spotlight_likes').select('spotlight_post_id', { count: 'exact', head: true }).eq('spotlight_post_id', postId),
      viewerId
        ? supabase.from('spotlight_likes').select('user_id').eq('spotlight_post_id', postId).eq('user_id', viewerId).maybeSingle()
        : Promise.resolve({ data: null } as const),
    ]);
    if (typeof count === 'number' && !Number.isNaN(count)) setLikesCount(count);
    setIsLiked(Boolean((likedRes as any)?.data?.user_id));
  }, [supabase, postId, viewerId]);

  useEffect(() => {
    void syncEngagement();
  }, [syncEngagement]);

  const handleShare = async () => {
    const url = `${window.location.origin}/sp/${encodeURIComponent(postId)}`;
    const title = creator?.display_name ? `${creator.display_name} on StoreLink Spotlight` : 'StoreLink Spotlight';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  const handleToggleLike = async () => {
    if (pendingLike || !postId) return;
    if (!viewerId) {
      void promptAuth('Liking this spotlight post');
      return;
    }
    setPendingLike(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const { error } = await supabase.rpc('toggle_spotlight_like', { p_spotlight_post_id: postId, p_user_id: viewerId });
      if (error) throw error;
      await syncEngagement();
    } catch {
      setIsLiked(!next);
      setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setPendingLike(false);
    }
  };

  const handleComment = () => {
    if (!viewerId) {
      void promptAuth('Commenting on this spotlight post');
      return;
    }
    const slug = String(creator?.slug || '').trim();
    if (slug) {
      window.location.href = `/${encodeURIComponent(slug)}`;
      return;
    }
    window.location.href = '/';
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--pitch-black)">
      {thumbSrc ? (
        <div className="absolute inset-0 scale-110 opacity-30 blur-3xl">
          <Image src={thumbSrc} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <div className="relative h-[85vh] w-full max-w-[420px] overflow-hidden rounded-none border border-(--border) bg-(--charcoal) shadow-2xl md:rounded-3xl">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            poster={thumbSrc || undefined}
            playsInline
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              if (el.paused) void el.play().catch(() => {});
              else el.pause();
            }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : thumbSrc ? (
          <Image src={thumbSrc} alt="Spotlight preview" fill className="object-cover opacity-80" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-(--charcoal)" aria-hidden />
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80" />

        <div className="absolute top-6 right-0 left-0 z-20 flex items-center justify-between px-4 pointer-events-auto">
          <Link href={backHref} className="text-lg font-black tracking-tighter text-white">
            StoreLink.
          </Link>
          <div className="flex items-center gap-2">
            {videoSrc ? (
              <button
                type="button"
                onClick={() => {
                  setIsMuted((m) => {
                    const next = !m;
                    const v = videoRef.current;
                    if (v) v.muted = next;
                    return next;
                  });
                }}
                className="rounded-full bg-black/40 p-2 text-white backdrop-blur-md hover:bg-black/60"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            ) : null}
            <a
              href={`storelink://sp/${post.id}`}
              className="flex items-center gap-1.5 rounded-full bg-(--emerald)/90 px-3 py-1.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-md hover:bg-(--emerald)"
            >
              <Smartphone size={12} />
              Open in app
            </a>
            <Button
              href={`/download?intent=${encodeURIComponent(`/sp/${post.id}`)}`}
              size="sm"
              variant="ghost"
              className="bg-black/40! py-1.5! text-[10px] font-bold text-white! uppercase hover:bg-black/60!"
            >
              Get app
            </Button>
          </div>
        </div>

        {videoSrc && !isPlaying ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const el = videoRef.current;
              if (!el) return;
              try {
                el.muted = false;
                setIsMuted(false);
              } catch {
                // ignore
              }
              void el.play().catch(() => {});
            }}
            className="pointer-events-auto absolute top-1/2 left-1/2 z-30 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-sm transition-transform duration-(--duration-150) hover:scale-110 group"
            aria-label="Play video"
          >
            <Play size={32} className="ml-1 text-white group-hover:scale-110 fill-white transition-transform" />
          </button>
        ) : null}

        {!videoSrc ? (
          <p className="absolute bottom-28 left-4 right-4 z-20 text-center text-xs text-white/70 pointer-events-none">
            This spotlight clip isn&apos;t playable in the browser. Open in the StoreLink app to watch.
          </p>
        ) : null}

        <div className="pointer-events-auto absolute right-4 bottom-28 z-20 flex flex-col items-center gap-6 text-white">
          <button type="button" onClick={() => void handleToggleLike()} className="flex flex-col items-center gap-1" aria-label="Like">
            <Heart size={28} strokeWidth={2} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
            <span className="text-[10px] font-bold">{likesCount.toLocaleString()}</span>
          </button>
          <button type="button" onClick={handleComment} className="flex flex-col items-center gap-1" aria-label="Comments">
            <MessageCircle size={28} strokeWidth={2} />
            <span className="text-[10px] font-bold">Chat</span>
          </button>
          <button type="button" onClick={() => void handleShare()} className="flex flex-col items-center gap-1" aria-label="Share">
            <Share2 size={28} strokeWidth={2} />
            <span className="text-[10px] font-bold">Share</span>
          </button>
        </div>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 p-6 pb-8">
          <div className="mb-3 flex items-center gap-2 text-violet-300">
            <Clapperboard size={16} />
            <span className="text-[10px] font-black tracking-wider uppercase">
              {post.spotlight_origin === 'tagged' ? 'TAGGED SPOTLIGHT' : 'SPOTLIGHT'}
            </span>
          </div>
          {creator?.display_name ? (
            <p className="text-sm font-bold text-white">
              {creator.display_name}
              {creator?.slug ? <span className="ml-2 text-xs text-white/70">@{creator.slug}</span> : null}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed font-medium text-white opacity-90">{post.caption || 'Spotlight post'}</p>
        </div>
      </div>
    </div>
  );
}
