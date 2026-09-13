'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Plus } from 'lucide-react';
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
  const [isSeller, setIsSeller] = useState(false);
  const [profileLogo, setProfileLogo] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [storiesRaw, setStoriesRaw] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setProfileId(uid);
    let loc: string | null = null;
    let seller = false;
    let profileRow: {
      location_country?: string | null;
      slug?: string | null;
      is_seller?: boolean | null;
      logo_url?: string | null;
      display_name?: string | null;
    } | null = null;
    if (uid) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('location_country, slug, is_seller, logo_url, display_name')
        .eq('id', uid)
        .maybeSingle();
      profileRow = profile;
      loc = profile?.location_country ?? null;
      setProfileSlug(profile?.slug ?? null);
      seller = Boolean(profile?.is_seller);
      setIsSeller(seller);
      setProfileLogo(profile?.logo_url ?? null);
      setProfileName(profile?.display_name ?? null);
    } else {
      setProfileSlug(null);
      setIsSeller(false);
      setProfileLogo(null);
      setProfileName(null);
    }
    const rows = await fetchDiscoveryStoriesFlat(supabase, {
      seed,
      userId: uid,
      locationCountry: loc,
    });
    let merged = rows || [];
    if (uid && seller) {
      const nowIso = new Date().toISOString();
      const { data: mine } = await supabase
        .from('stories')
        .select('id,seller_id,created_at,expires_at,type')
        .eq('seller_id', uid)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mine?.id && !merged.some((row: any) => String(row.seller_id) === String(uid))) {
        merged = [
          {
            id: mine.id,
            seller_id: uid,
            created_at: mine.created_at,
            type: mine.type,
            display_name: profileRow?.display_name ?? null,
            seller_slug: profileRow?.slug ?? null,
            slug: profileRow?.slug ?? null,
            logo_url: profileRow?.logo_url ?? null,
            is_seen: true,
            views_count: 0,
          },
          ...merged,
        ];
      }
    }
    setStoriesRaw(merged);
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

  const myStory = useMemo(
    () => (profileId ? stories.find((s) => String(s.seller_id) === String(profileId)) : undefined),
    [stories, profileId],
  );
  const stripStories = useMemo(
    () => (profileId && isSeller ? stories.filter((s) => String(s.seller_id) !== String(profileId)) : stories),
    [stories, profileId, isSeller],
  );

  if (stories.length === 0 && !isSeller) return null;

  const leadAvatarSrc =
    normalizeWebMediaUrl(myStory?.logo_url || profileLogo) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(myStory?.display_name || profileName || 'You')}`;

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
        {isSeller && profileId ? (
          <Link
            href={
              myStory?.id
                ? `/app/story-viewer/${encodeURIComponent(String(myStory.id))}`
                : '/app/seller/post-story'
            }
            className="relative w-[62px] shrink-0 text-center"
            aria-label={myStory ? 'Your story' : 'Post a story'}
          >
            <div className="relative mx-auto h-[66px] w-[66px]">
              {myStory ? (
                <div
                  className="box-border flex h-full w-full items-center justify-center rounded-[20px] p-[2px]"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${getGradients(myStory.has_video, myStory.is_seen).join(', ')})`,
                  }}
                >
                  <div className="relative box-border flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-(--background)">
                    <Image
                      src={leadAvatarSrc}
                      alt=""
                      width={56}
                      height={56}
                      className="block h-14 w-14 shrink-0 rounded-[16px] object-cover"
                      unoptimized
                    />
                    {myStory.has_video ? (
                      <span className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-black">
                        <Play size={7} className="text-white" fill="white" />
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <div className="box-border flex h-full w-full items-center justify-center rounded-[20px] border-2 border-dashed border-(--muted)/50 p-[2px]">
                    <div className="relative box-border flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-(--surface)">
                      <Image
                        src={leadAvatarSrc}
                        alt=""
                        width={56}
                        height={56}
                        className="block h-14 w-14 shrink-0 rounded-[16px] object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 right-0 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-(--background) bg-[#fe2c55] text-white">
                    <Plus size={10} strokeWidth={3} />
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 w-full truncate text-center text-[10px] font-medium text-(--muted)">Your story</p>
          </Link>
        ) : null}
        {stripStories.map((story) => {
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
