export type BookingRequestMessageMetadata = {
  service_order_id: string;
  service_listing_id?: string | null;
  menu_item_name?: string | null;
  amount_minor?: number | null;
  currency_code?: string | null;
};

export function buildBookingRequestMetadata(input: {
  serviceOrderId: string;
  serviceListingId?: string | null;
  menuItemName?: string | null;
  amountMinor?: number | null;
  currencyCode?: string | null;
}): BookingRequestMessageMetadata {
  return {
    service_order_id: input.serviceOrderId,
    service_listing_id: input.serviceListingId ?? null,
    menu_item_name: input.menuItemName ?? null,
    amount_minor: input.amountMinor ?? null,
    currency_code: input.currencyCode ?? null,
  };
}
