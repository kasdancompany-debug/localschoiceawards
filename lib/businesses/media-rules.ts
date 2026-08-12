const MAX_BYTES = 5 * 1024 * 1024;

export function assertBusinessMediaPathOwned(businessId: string, storagePath: string): void {
  const expectedPrefix = `${businessId}/`;
  if (!storagePath.startsWith(expectedPrefix) || storagePath.includes("..")) {
    throw new Error("Invalid media storage path for this business.");
  }
}

export function assertBusinessMediaSize(byteLength: number): void {
  if (byteLength > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
}

export const BUSINESS_MEDIA_MAX_BYTES = MAX_BYTES;
