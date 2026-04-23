'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { fetchDiscoveryStoriesFlat } from '@/lib/discovery-stories';
import { normalizeWebMediaUrl } from '@/lib/media-url';

const GRAY_RING_HIDE_AFTER_MS = 15 * 60 * 1000;

function getGradients(hasVideo: boolean, isSeen: boolean): [string, string] {
  if (isSeen) return ['#374151', '#4b5563'];
  if (hasVideo) return ['#f59e0b', '#f43f5e'];
  return ['#10b981', '#10b981'];
}

/**
 * Parity with store-link-mobile/src/components/StoryRow.tsx (RPC, fallback, dedupe, sort, ring timing, pulse).
 */
export default function StoryRowWeb({ seed }: { seed: string; compact?: boolean }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [storiesRaw, setStoriesRaw] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setProfileId(uid);
    let loc: string | null = null;
    if (uid) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('location_country, slug')
        .eq('id', uid)
        .maybeSingle();
      loc = profile?.location_country ?? null;
      setProfileSlug(profile?.slug ?? null);
    } else {
      setProfileSlug(null);
    }
    const rows = await fetchDiscoveryStoriesFlat(supabase, {
      seed,
      userId: uid,
      locationCountry: loc,
    });
    setStoriesRaw(rows);
  }, [seed, supabase]);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  useEffect(() => {
    const onRefresh = () => {
      void load();
    };
    window.addEventListener('storelink:stories-refresh', onRefresh);
    return () => window.removeEventListener('storelink:stories-refresh', onRefresh);
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const stories = useMemo(() => {
    const pickSlug = (row: any) =>
      String(row?.slug || row?.seller_slug || row?.seller?.slug || row?.profiles?.slug || '')
        .trim() || null;

    const uniqueSellersMap = new Map<string, any>();
    (storiesRaw || []).forEach((s: any) => {
      const existing = uniqueSellersMap.get(s.seller_id);
      const isUnseen = s.is_seen === false;
      const baseCount = existing?.story_count ?? 0;
      const nextCount = baseCount + 1;
      const viewsCount = Number(s.views_count) || 0;
      const lastViewedAt = s.last_viewed_at ? new Date(s.last_viewed_at).getTime() : null;

      if (!existing) {
        uniqueSellersMap.set(s.seller_id, {
          id: s.id,
          seller_id: s.seller_id,
          display_name: s.display_name,
          seller_slug: pickSlug(s),
          slug: pickSlug(s),
          logo_url: s.logo_url,
          has_video: s.type === 'video',
          created_at: s.created_at,
          is_seen: s.is_seen,
          story_count: nextCount,
          views_count: viewsCount,
          last_viewed_at: lastViewedAt,
        });
      } else if (existing.is_seen === true && isUnseen) {
        uniqueSellersMap.set(s.seller_id, {
          id: s.id,
          seller_id: s.seller_id,
          display_name: s.display_name,
          seller_slug: pickSlug(s) || pickSlug(existing),
          slug: pickSlug(s) || pickSlug(existing),
          logo_url: s.logo_url,
          has_video: s.type === 'video',
          created_at: s.created_at,
          is_seen: s.is_seen,
          story_count: nextCount,
          views_count: viewsCount,
          last_viewed_at: lastViewedAt,
        });
      } else {
        uniqueSellersMap.set(s.seller_id, {
          ...existing,
          seller_slug: pickSlug(existing) || pickSlug(s),
          slug: pickSlug(existing) || pickSlug(s),
          display_name: existing.display_name || s.display_name,
          logo_url: existing.logo_url || s.logo_url,
          story_count: nextCount,
          views_count: existing.views_count ?? viewsCount,
          last_viewed_at: existing.last_viewed_at ?? lastViewedAt,
        });
      }
    });
    const now = Date.now();
    const list = Array.from(uniqueSellersMap.values()).filter((story) => {
      const isMine = story.seller_id === profileId;
      if (isMine) return true;
      if (!story.is_seen) return true;
      const lastViewed = story.last_viewed_at;
      if (!lastViewed) return true;
      if (now - lastViewed <= GRAY_RING_HIDE_AFTER_MS) return true;
      return false;
    });
    return list.sort((a, b) => {
      if (a.seller_id === profileId) return -1;
      if (b.seller_id === profileId) return 1;
      if (a.is_seen !== b.is_seen) return a.is_seen ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [storiesRaw, profileId, tick]);

  if (stories.length === 0) return null;

  return (
    <div className="border-b border-(--border) bg-(--background) pb-0 pt-0.5">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes storelink-story-ring-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
.storelink-story-ring-pulse { animation: storelink-story-ring-pulse 1.5s ease-in-out infinite; }
`,
        }}
      />
      <div className="flex gap-3 overflow-x-auto px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((story) => {
          const colors = getGradients(story.has_video, story.is_seen);
          const isMine = story.seller_id === profileId;
          const rawSlug = String(
            story.slug ||
              story.seller_slug ||
              (story as any)?.seller?.slug ||
              (story as any)?.profiles?.slug ||
              (isMine ? profileSlug || '' : '') ||
              '',
          )
            .trim()
            .replace(/^@+/, '');
          const storySlugLabel = rawSlug.length > 0 ? rawSlug : 'user';
          const pulse = story.has_video && !story.is_seen;

          return (
            <Link
              key={`story-${story.seller_id}`}
              href={`/app/story-viewer/${encodeURIComponent(story.id)}`}
              className="shrink-0 w-[62px] text-center"
            >
              <div className={`mx-auto h-[66px] w-[66px] ${pulse ? 'storelink-story-ring-pulse' : ''}`}>
                <div
                  className="box-border flex h-full w-full items-center justify-center rounded-[20px] p-[2px]"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                  }}
                >
                  <div className="relative box-border flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-(--background)">
                    <Image
                      src={
                        normalizeWebMediaUrl(story.logo_url) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(story.display_name || 'Store')}`
                      }
                      alt=""
                      width={56}
                      height={56}
                      className="block h-14 w-14 shrink-0 rounded-[16px] object-cover"
                      unoptimized
                    />
                    {story.has_video ? (
                      <span className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-black">
                        <Play size={7} className="text-white" fill="white" />
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <p className="mt-1 w-full truncate text-center text-[10px] font-medium text-(--muted)">{storySlugLabel}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
