import "server-only";

import sharp from "sharp";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import type { ProductionPersonalizationRecord } from "@/types/fulfillment";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildProductionArtworkSvg(record: ProductionPersonalizationRecord): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#f7f4ef"/>
  <text x="80" y="120" fill="#222" font-family="Georgia, serif" font-size="36">LOCALS CHOICE AWARDS — PRODUCTION ARTWORK</text>
  <text x="80" y="220" fill="#111" font-family="Georgia, serif" font-size="56" font-weight="700">${escapeXml(record.businessName)}</text>
  <text x="80" y="300" fill="#333" font-family="Arial, sans-serif" font-size="32">${escapeXml(record.placement)} · ${escapeXml(record.categoryName)}</text>
  <text x="80" y="360" fill="#555" font-family="Arial, sans-serif" font-size="28">${escapeXml(record.communityName)} · ${record.campaignYear}</text>
  <text x="80" y="480" fill="#222" font-family="Arial, sans-serif" font-size="26">Product: ${escapeXml(record.productName)} (${escapeXml(record.variantName)})</text>
  <text x="80" y="530" fill="#222" font-family="Arial, sans-serif" font-size="26">SKU: ${escapeXml(record.sku)} · Qty: ${record.quantity}</text>
  <text x="80" y="580" fill="#222" font-family="Arial, sans-serif" font-size="26">Order: ${escapeXml(record.orderNumber)}</text>
  <text x="80" y="700" fill="#222" font-family="Arial, sans-serif" font-size="24">Artwork instructions (frozen):</text>
  <text x="80" y="760" fill="#333" font-family="Arial, sans-serif" font-size="22">${escapeXml(record.businessName)}</text>
  <text x="80" y="810" fill="#333" font-family="Arial, sans-serif" font-size="22">${escapeXml(record.placement)} / ${escapeXml(record.categoryName)}</text>
  <text x="80" y="860" fill="#333" font-family="Arial, sans-serif" font-size="22">${escapeXml(record.communityName)} / ${record.campaignYear}</text>
  <text x="80" y="940" fill="#666" font-family="Arial, sans-serif" font-size="20">Do not invent alternate winner wording.</text>
</svg>`;
}

export async function storeProtectedArtwork(input: {
  fulfillmentId: string;
  fulfillmentItemId: string;
  record: ProductionPersonalizationRecord;
}): Promise<string> {
  const svg = buildProductionArtworkSvg(input.record);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const path = `${input.fulfillmentId}/${input.fulfillmentItemId}.png`;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from("fulfillment-artwork").upload(path, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    throw new Error(`Artwork upload failed: ${error.message}`);
  }
  return path;
}

export async function getSignedArtworkUrl(path: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from("fulfillment-artwork")
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
