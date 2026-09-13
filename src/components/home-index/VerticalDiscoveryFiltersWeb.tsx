'use client';

import {
  FOOD_DISCOVERY_FILTERS,
  type FoodDiscoveryFilterId,
} from '@/lib/foodDiscovery';
import {
  BEAUTY_DISCOVERY_FILTERS,
  type BeautyDiscoveryFilterId,
} from '@/lib/beautyDiscovery';
import {
  FASHION_DISCOVERY_FILTERS,
  type FashionDiscoveryFilterId,
} from '@/lib/fashionDiscovery';
import {
  REAL_ESTATE_DISCOVERY_FILTERS,
  type RealEstateDiscoveryFilterId,
} from '@/lib/realEstateDiscovery';
import {
  WELLNESS_DISCOVERY_FILTERS,
  type WellnessDiscoveryFilterId,
} from '@/lib/wellnessDiscovery';
import {
  AUTOMOTIVE_DISCOVERY_FILTERS,
  type AutomotiveDiscoveryFilterId,
} from '@/lib/automotiveDiscovery';
import {
  HOME_TRADES_DISCOVERY_FILTERS,
  type HomeTradesDiscoveryFilterId,
} from '@/lib/homeTradesDiscovery';
import {
  ELECTRONICS_DISCOVERY_FILTERS,
  type ElectronicsDiscoveryFilterId,
} from '@/lib/electronicsDiscovery';
import {
  EVENTS_DISCOVERY_FILTERS,
  type EventsDiscoveryFilterId,
} from '@/lib/eventsDiscovery';

type Chip = { id: string; label: string };

function ChipRow({
  chips,
  active,
  onToggle,
}: {
  chips: Chip[];
  active: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => {
        const selected = active.has(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onToggle(chip.id)}
            aria-pressed={selected}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
              selected
                ? 'border-(--foreground) bg-(--foreground) text-(--background)'
                : 'border-(--border) bg-(--surface) text-(--foreground)'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export function FoodDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<FoodDiscoveryFilterId>;
  onToggle: (id: FoodDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={FOOD_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as FoodDiscoveryFilterId)}
    />
  );
}

export function BeautyDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<BeautyDiscoveryFilterId>;
  onToggle: (id: BeautyDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={BEAUTY_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as BeautyDiscoveryFilterId)}
    />
  );
}

export function FashionDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<FashionDiscoveryFilterId>;
  onToggle: (id: FashionDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={FASHION_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as FashionDiscoveryFilterId)}
    />
  );
}

export function RealEstateDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<RealEstateDiscoveryFilterId>;
  onToggle: (id: RealEstateDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={REAL_ESTATE_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as RealEstateDiscoveryFilterId)}
    />
  );
}

export function WellnessDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<WellnessDiscoveryFilterId>;
  onToggle: (id: WellnessDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={WELLNESS_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as WellnessDiscoveryFilterId)}
    />
  );
}

export function AutomotiveDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<AutomotiveDiscoveryFilterId>;
  onToggle: (id: AutomotiveDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={AUTOMOTIVE_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as AutomotiveDiscoveryFilterId)}
    />
  );
}

export function HomeTradesDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<HomeTradesDiscoveryFilterId>;
  onToggle: (id: HomeTradesDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={HOME_TRADES_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as HomeTradesDiscoveryFilterId)}
    />
  );
}

export function ElectronicsDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<ElectronicsDiscoveryFilterId>;
  onToggle: (id: ElectronicsDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={ELECTRONICS_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as ElectronicsDiscoveryFilterId)}
    />
  );
}

export function EventsDiscoveryFiltersWeb({
  active,
  onToggle,
}: {
  active: ReadonlySet<EventsDiscoveryFilterId>;
  onToggle: (id: EventsDiscoveryFilterId) => void;
}) {
  return (
    <ChipRow
      chips={EVENTS_DISCOVERY_FILTERS}
      active={active}
      onToggle={(id) => onToggle(id as EventsDiscoveryFilterId)}
    />
  );
}
