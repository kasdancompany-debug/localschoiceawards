import QRCode from "qrcode";

export function buildFinalistShareCaption(input: {
  businessName: string;
  communityName: string;
  categoryName?: string | null;
  year: number;
  shareUrl: string;
}): string {
  const categoryBit = input.categoryName ? ` for ${input.categoryName}` : "";
  return `We're a finalist in the ${input.communityName} Locals Choice Awards ${input.year}${categoryBit}! Cast your vote: ${input.shareUrl}`;
}

export function buildFinalistSquareSvg(input: {
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
      <stop offset="0%" stop-color="#1a3a4a"/>
      <stop offset="100%" stop-color="#0d2430"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="920" cy="140" r="200" fill="#d4a84b" opacity="0.2"/>
  <text x="80" y="160" fill="#f4efe6" font-family="Georgia, serif" font-size="42" letter-spacing="4">LOCALS CHOICE AWARDS</text>
  <text x="80" y="420" fill="#f4efe6" font-family="Georgia, serif" font-size="72" font-weight="700">${name}</text>
  <text x="80" y="520" fill="#d4a84b" font-family="Arial, sans-serif" font-size="40">Finalist · ${community} ${input.year}</text>
  <text x="80" y="980" fill="#f4efe6" font-family="Arial, sans-serif" font-size="28" opacity="0.8">Vote for your local favourites</text>
</svg>`;
}

export function buildFinalistStorySvg(input: {
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
      <stop offset="0%" stop-color="#1a3a4a"/>
      <stop offset="100%" stop-color="#071820"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <rect x="72" y="220" width="936" height="4" fill="#d4a84b"/>
  <text x="80" y="200" fill="#d4a84b" font-family="Arial, sans-serif" font-size="28" letter-spacing="6">FINALIST BADGE</text>
  <text x="80" y="780" fill="#f4efe6" font-family="Georgia, serif" font-size="84" font-weight="700">${name}</text>
  <text x="80" y="900" fill="#f4efe6" font-family="Arial, sans-serif" font-size="40">${community} Locals Choice ${input.year}</text>
  <text x="80" y="1700" fill="#f4efe6" font-family="Arial, sans-serif" font-size="32" opacity="0.85">Scan or tap to vote</text>
</svg>`;
}

export async function buildVoteQrDataUrl(shareUrl: string): Promise<string> {
  return QRCode.toDataURL(shareUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#1a3a4a", light: "#ffffff" },
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
