'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WebProductCartItem {
  product_id: string;
  seller_id?: string | null;
  slug?: string | null;
  name: string;
  price: number;
  anchor_price?: number | null;
  is_flash_active?: boolean;
  seller_loyalty_enabled?: boolean;
  seller_loyalty_percentage?: number;
  currency_code?: string;
  image_url?: string | null;
  seller_slug?: string | null;
  seller_name?: string | null;
  quantity: number;
}

export interface WebServiceCartItem {
  service_listing_id: string;
  seller_id?: string | null;
  title: string;
  hero_price: number;
  delivery_type?: string | null;
  location_type?: string | null;
  service_distance_label?: string | null;
  service_delivery_badge?: string | null;
  selected_menu_name?: string | null;
  selected_menu_price_minor?: number | null;
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
  updateProductQuantity: (productId: string, quantity: number) => void;
  clearProducts: () => void;
  addService: (item: WebServiceCartItem) => void;
  updateServiceSelection: (serviceListingId: string, menuName: string | null, menuPriceMinor: number | null) => void;
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
      updateProductQuantity: (productId, quantity) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.product_id === productId ? { ...p, quantity: Math.max(1, Math.min(99, Math.floor(Number(quantity) || 1))) } : p,
          ),
        })),
      clearProducts: () => set({ products: [] }),

      addService: (item) => {
        const targetId = String(item.service_listing_id || '').trim();
        if (!targetId) return;
        set((state) => {
          if (state.services.some((s) => s.service_listing_id === targetId)) return state;
          return { services: [...state.services, { ...item, service_listing_id: targetId }] };
        });
      },
      updateServiceSelection: (serviceListingId, menuName, menuPriceMinor) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.service_listing_id === serviceListingId
              ? {
                  ...s,
                  selected_menu_name: menuName,
                  selected_menu_price_minor: menuPriceMinor,
                }
              : s,
          ),
        })),
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

