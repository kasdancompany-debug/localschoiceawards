import QRCode from "qrcode";

export function buildNomineeShareCaption(input: {
  businessName: string;
  communityName: string;
  categoryName?: string | null;
  year: number;
  shareUrl: string;
}): string {
  const categoryBit = input.categoryName ? ` for ${input.categoryName}` : "";
  return `We're nominated in the ${input.communityName} Locals Choice Awards ${input.year}${categoryBit}! Help nominate your favourites: ${input.shareUrl}`;
}

export function buildSquareSocialSvg(input: {
  businessName: string;
  communityName: string;
  year: number;
}): string {
  const name = escapeXml(input.businessName);
  const community = escapeXml(input.communityName);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f3d2e"/>
      <stop offset="100%" stop-color="#1a5c45"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="900" cy="160" r="220" fill="#c4a35a" opacity="0.18"/>
  <circle cx="140" cy="920" r="280" fill="#f4efe6" opacity="0.08"/>
  <text x="80" y="160" fill="#f4efe6" font-family="Georgia, serif" font-size="42" letter-spacing="4">LOCALS CHOICE AWARDS</text>
  <text x="80" y="420" fill="#f4efe6" font-family="Georgia, serif" font-size="72" font-weight="700">${name}</text>
  <text x="80" y="520" fill="#c4a35a" font-family="Arial, sans-serif" font-size="40">Nominee · ${community} ${input.year}</text>
  <text x="80" y="980" fill="#f4efe6" font-family="Arial, sans-serif" font-size="28" opacity="0.8">Nominate your local favourites</text>
</svg>`;
}

export function buildStorySocialSvg(input: {
  businessName: string;
  communityName: string;
  year: number;
}): string {
  const name = escapeXml(input.businessName);
  const community = escapeXml(input.communityName);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#123d30"/>
      <stop offset="100%" stop-color="#0a241c"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <rect x="72" y="220" width="936" height="4" fill="#c4a35a"/>
  <text x="80" y="200" fill="#c4a35a" font-family="Arial, sans-serif" font-size="28" letter-spacing="6">NOMINEE BADGE</text>
  <text x="80" y="780" fill="#f4efe6" font-family="Georgia, serif" font-size="84" font-weight="700">${name}</text>
  <text x="80" y="900" fill="#f4efe6" font-family="Arial, sans-serif" font-size="40">${community} Locals Choice ${input.year}</text>
  <text x="80" y="1700" fill="#f4efe6" font-family="Arial, sans-serif" font-size="32" opacity="0.85">Scan or tap to nominate</text>
</svg>`;
}

export async function buildQrDataUrl(shareUrl: string): Promise<string> {
  return QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0f3d2e", light: "#ffffff" },
  });
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
