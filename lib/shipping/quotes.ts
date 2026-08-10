/**
 * Placeholder address type retained for future carrier integrations.
 * Live shipping quotes are created server-side in `lib/commerce/shipping.ts`
 * and never trust a client-supplied shipping amount.
 */
export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: "CA" | "US";
};
