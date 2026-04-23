'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WebProductCartItem {
  product_id: string;
  slug?: string | null;
  name: string;
  price: number;
  currency_code?: string;
  image_url?: string | null;
  seller_slug?: string | null;
  seller_name?: string | null;
  quantity: number;
}

export interface WebServiceCartItem {
  service_listing_id: string;
  title: string;
  hero_price: number;
  currency_code?: string;
  image_url?: string | null;
  seller_slug?: string | null;
  seller_name?: string | null;
}

interface WebCartState {
  products: WebProductCartItem[];
  services: WebServiceCartItem[];
  addProduct: (item: Omit<WebProductCartItem, 'quantity'>) => void;
  removeProduct: (productId: string) => void;
  clearProducts: () => void;
  addService: (item: WebServiceCartItem) => void;
  removeService: (serviceListingId: string) => void;
  clearServices: () => void;
  productCount: () => number;
  serviceCount: () => number;
  totalCount: () => number;
}

export const useWebCartStore = create<WebCartState>()(
  persist(
    (set, get) => ({
      products: [],
      services: [],

      addProduct: (item) => {
        const targetId = String(item.product_id || '').trim();
        if (!targetId) return;
        set((state) => {
          const existing = state.products.find((p) => p.product_id === targetId);
          if (existing) {
            return {
              products: state.products.map((p) =>
                p.product_id === targetId ? { ...p, quantity: Math.min(99, p.quantity + 1) } : p,
              ),
            };
          }
          return { products: [...state.products, { ...item, product_id: targetId, quantity: 1 }] };
        });
      },

      removeProduct: (productId) =>
        set((state) => ({ products: state.products.filter((p) => p.product_id !== productId) })),
      clearProducts: () => set({ products: [] }),

      addService: (item) => {
        const targetId = String(item.service_listing_id || '').trim();
        if (!targetId) return;
        set((state) => {
          if (state.services.some((s) => s.service_listing_id === targetId)) return state;
          return { services: [...state.services, { ...item, service_listing_id: targetId }] };
        });
      },
      removeService: (serviceListingId) =>
        set((state) => ({ services: state.services.filter((s) => s.service_listing_id !== serviceListingId) })),
      clearServices: () => set({ services: [] }),

      productCount: () => get().products.reduce((acc, p) => acc + Math.max(1, Number(p.quantity || 1)), 0),
      serviceCount: () => get().services.length,
      totalCount: () => get().productCount() + get().serviceCount(),
    }),
    {
      name: 'storelink-web-unified-cart-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

