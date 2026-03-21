'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  Share2,
  MapPin,
  Gem,
  CheckCircle,
  ShieldCheck,
  Info,
  Image as ImageIcon,
  MessageCircle,
  CalendarCheck2,
  Heart,
  Bookmark,
} from 'lucide-react';
import AppTrapModal from '@/components/ui/DownloadTrap';
import Button from '@/components/ui/Button';

type TrapTrigger = 'buy' | 'view' | 'chat';

const formatMoney = (amountMinor: number, currency: string) => {
  const main = (Number(amountMinor) || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(main || 0);
};

export default function ClientServiceWrapper({ service, seller }: any) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [trapOpen, setTrapOpen] = useState(false);
  const [trapTrigger, setTrapTrigger] = useState<TrapTrigger>('buy');

  const media = (service.media as string[] | null) || [];
  const images = Array.isArray(media) ? media : [];
  const sellerAvatar =
    seller.logo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      seller.display_name || 'Store',
    )}&background=10b981&color=fff`;

  const handleTrap = (trigger: TrapTrigger) => {
    setTrapTrigger(trigger);
    setTrapOpen(true);
  };

  const fromLabel = formatMoney(service.hero_price_min, service.currency_code || 'NGN');
  const likesCount = Number(service.likes_count || 0);
  const commentsCount = Number(service.comments_count || 0);
  const wishlistCount = Number(service.wishlist_count || 0);
  const locationParts = [seller.location_city, seller.location_state].filter(Boolean);
  const locationLabel = locationParts.join(', ');

  let deliveryBadge: string | null = null;
  if (service.delivery_type === 'online') {
    deliveryBadge = 'ONLINE';
  } else if (service.delivery_type === 'in_person' && service.location_type === 'i_travel') {
    deliveryBadge = 'I TRAVEL';
  } else if (service.delivery_type === 'in_person' && service.location_type === 'both') {
    deliveryBadge = 'STUDIO & HOME';
  } else if (service.delivery_type === 'in_person' && service.location_type === 'at_my_place') {
    deliveryBadge = 'STUDIO ONLY';
  } else if (service.delivery_type === 'both') {
    deliveryBadge = 'STUDIO & HOME';
  }

  const intentPath = `/s/${seller.slug}/service/${service.id}`;

  return (
    <div className="min-h-screen bg-(--background) pt-24 pb-10">
      <div className="max-w-md mx-auto bg-(--card) min-h-[90vh] shadow-2xl rounded-3xl overflow-hidden relative flex flex-col border border-(--border) pb-24">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-4">
          <Link
            href={`/${seller.slug}`}
            className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTrap('view')}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            >
              <Heart size={18} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => handleTrap('view')}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            >
              <Bookmark size={18} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => handleTrap('view')}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            >
              <Share2 size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Media carousel */}
        <div className="relative aspect-4/5 bg-(--surface)">
          <div
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            onScroll={(e) => {
              const scrollLeft = e.currentTarget.scrollLeft;
              const width = e.currentTarget.offsetWidth;
              setActiveImageIndex(Math.round(scrollLeft / width));
            }}
          >
            {images.length > 0 ? (
              images.map((img: string, idx: number) => (
                <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                  <Image
                    src={img}
                    alt={`${service.title} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-(--surface) text-(--muted)">
                <ImageIcon size={40} />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImageIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Service info */}
        <div className="px-6 pt-6">
          <div className="mb-6">
            <p className="text-xs font-black text-emerald-600 tracking-[0.2em] uppercase mb-1">
              {service.service_category}
            </p>
            <h1 className="text-xl font-black text-(--foreground) leading-snug mb-2">
              {service.title}
            </h1>
            <p className="text-sm font-bold text-(--muted) uppercase tracking-widest mb-1">
              From
            </p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">{fromLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {service.service_category && (
                <span className="px-2 py-1 rounded-full bg-(--surface) border border-(--border) text-[9px] font-black tracking-widest text-(--muted) uppercase">
                  {String(service.service_category).replace(/_/g, ' ').toUpperCase()}
                </span>
              )}
              {deliveryBadge && (
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black tracking-widest text-emerald-700 uppercase">
                  {deliveryBadge}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] font-black text-(--muted) uppercase tracking-widest">
              <span className="inline-flex items-center gap-1"><Heart size={12} /> {likesCount}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {commentsCount}</span>
              <span className="inline-flex items-center gap-1"><Bookmark size={12} /> {wishlistCount}</span>
            </div>
          </div>

          <p className="text-[10px] font-black text-(--muted) uppercase tracking-[0.18em] mb-2">SERVICE BY</p>
          <Link
            href={`/${seller.slug}`}
            className="flex items-center gap-3 p-3 bg-(--surface) rounded-2xl mb-6 active:bg-(--border) transition-colors duration-(--duration-150)"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-(--border) overflow-hidden border border-(--border)">
                <Image src={sellerAvatar} alt={seller.display_name} fill className="object-cover" />
              </div>
              {seller.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                  <CheckCircle size={14} className="text-emerald-500" fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-(--foreground)">{seller.display_name}</p>
                {seller.subscription_plan === 'diamond' && (
                  <Gem size={12} className="text-purple-500" fill="currentColor" />
                )}
              </div>
              <p className="text-xs text-(--muted) font-medium">@{seller.slug}</p>
            </div>
            {locationLabel && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-(--muted) uppercase tracking-widest">
                <MapPin size={10} />
                <span>{locationLabel}</span>
              </div>
            )}
          </Link>

          {deliveryBadge && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              <CalendarCheck2 size={12} />
              <span>{deliveryBadge}</span>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={14} /> DESCRIPTION
            </h3>
            <p className="text-sm text-(--muted) leading-relaxed whitespace-pre-wrap">
              {service.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
            <ShieldCheck size={20} className="text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-(--foreground) mb-1">Finish booking in the app</p>
              <p className="text-[11px] text-(--muted) leading-relaxed">
                Booking, payments, and disputes are fully protected inside the StoreLink app. We hold funds in escrow until the job is done.
              </p>
              <p className="mt-1 text-[10px] text-(--muted)">
                See, buy, and book the people you follow – products and services in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Open in app + download */}
        <a
          href={`storelink://s/${seller.slug}/service/${service.id}`}
          className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-600 hover:text-emerald-700"
        >
          OPEN IN APP
        </a>
        <Button
          href={`/download?intent=${encodeURIComponent(intentPath)}`}
          variant="ghost"
          size="sm"
          className="text-(--muted) font-medium"
        >
          Don&apos;t have the app yet? Download to finish booking.
        </Button>

        {/* Bottom fixed CTA: always traps to download */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-(--card) border-t border-(--border) flex gap-3 z-30">
          <Button
            onClick={() => handleTrap('chat')}
            variant="outline"
            size="lg"
            className="w-14 p-0! justify-center rounded-2xl"
          >
            <MessageCircle size={24} strokeWidth={2} />
          </Button>
          <Button
            onClick={() => handleTrap('buy')}
            variant="secondary"
            size="lg"
            className="flex-1 justify-center gap-2 rounded-2xl"
          >
            <CalendarCheck2 size={20} strokeWidth={2.5} />
            <span className="font-bold text-sm tracking-wide">CHECK AVAILABILITY</span>
          </Button>
        </div>
      </div>

      <AppTrapModal
        isOpen={trapOpen}
        onClose={() => setTrapOpen(false)}
        sellerName={seller.display_name}
        trigger={trapTrigger}
        intentPath={intentPath}
      />
    </div>
  );
}

