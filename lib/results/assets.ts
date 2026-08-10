import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";

import { placementLabel } from "@/lib/results/rules";
import type { ResultPlacement } from "@/types/results";

export function buildWinnerBadgeSvg(input: {
  businessName: string;
  communityName: string;
  categoryName: string;
  year: number;
  placement: ResultPlacement;
}): string {
  const placement = escapeXml(placementLabel(input.placement));
  const business = escapeXml(input.businessName);
  const community = escapeXml(input.communityName);
  const category = escapeXml(input.categoryName);
  const accent = placementAccent(input.placement);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="470" fill="none" stroke="${accent}" stroke-width="36"/>
  <circle cx="512" cy="512" r="410" fill="none" stroke="${accent}" stroke-width="8" opacity="0.55"/>
  <text x="512" y="300" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-size="42" letter-spacing="6">LOCALS CHOICE</text>
  <text x="512" y="420" text-anchor="middle" fill="#1a1a1a" font-family="Georgia, serif" font-size="86" font-weight="700">${placement}</text>
  <text x="512" y="520" text-anchor="middle" fill="#333" font-family="Arial, sans-serif" font-size="36">${input.year}</text>
  <text x="512" y="620" text-anchor="middle" fill="#111" font-family="Georgia, serif" font-size="40">${business}</text>
  <text x="512" y="690" text-anchor="middle" fill="#555" font-family="Arial, sans-serif" font-size="28">${category}</text>
  <text x="512" y="760" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="26">${community}</text>
</svg>`;
}

export function buildWinnerSquareSvg(input: {
  businessName: string;
  communityName: string;
  categoryName: string;
  year: number;
  placement: ResultPlacement;
}): string {
  const placement = escapeXml(placementLabel(input.placement));
  const business = escapeXml(input.businessName);
  const community = escapeXml(input.communityName);
  const category = escapeXml(input.categoryName);
  const accent = placementAccent(input.placement);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1b2a24"/>
      <stop offset="100%" stop-color="#0d1713"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="900" cy="160" r="220" fill="${accent}" opacity="0.18"/>
  <text x="80" y="160" fill="#f4efe6" font-family="Georgia, serif" font-size="40" letter-spacing="4">LOCALS CHOICE AWARDS</text>
  <text x="80" y="360" fill="${accent}" font-family="Arial, sans-serif" font-size="36" letter-spacing="4">${placement.toUpperCase()} WINNER</text>
  <text x="80" y="480" fill="#f4efe6" font-family="Georgia, serif" font-size="72" font-weight="700">${business}</text>
  <text x="80" y="570" fill="#f4efe6" font-family="Arial, sans-serif" font-size="34">${category}</text>
  <text x="80" y="980" fill="#f4efe6" font-family="Arial, sans-serif" font-size="28" opacity="0.85">${community} · ${input.year}</text>
</svg>`;
}

export function buildWinnerStorySvg(input: {
  businessName: string;
  communityName: string;
  categoryName: string;
  year: number;
  placement: ResultPlacement;
}): string {
  const placement = escapeXml(placementLabel(input.placement));
  const business = escapeXml(input.businessName);
  const community = escapeXml(input.communityName);
  const category = escapeXml(input.categoryName);
  const accent = placementAccent(input.placement);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b2a24"/>
      <stop offset="100%" stop-color="#07110d"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <rect x="72" y="220" width="936" height="4" fill="${accent}"/>
  <text x="80" y="200" fill="${accent}" font-family="Arial, sans-serif" font-size="28" letter-spacing="6">WINNER</text>
  <text x="80" y="700" fill="${accent}" font-family="Arial, sans-serif" font-size="40" letter-spacing="4">${placement.toUpperCase()}</text>
  <text x="80" y="820" fill="#f4efe6" font-family="Georgia, serif" font-size="84" font-weight="700">${business}</text>
  <text x="80" y="940" fill="#f4efe6" font-family="Arial, sans-serif" font-size="36">${category}</text>
  <text x="80" y="1700" fill="#f4efe6" font-family="Arial, sans-serif" font-size="32" opacity="0.85">${community} Locals Choice ${input.year}</text>
</svg>`;
}

export async function svgToPngBuffer(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function buildWinnerQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#1b2a24", light: "#ffffff" },
  });
}

export async function buildWinnerCertificatePdf(input: {
  businessName: string;
  communityName: string;
  categoryName: string;
  year: number;
  placement: ResultPlacement;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]);
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.75, 0.62, 0.3),
    borderWidth: 3,
  });

  page.drawText("Locals Choice Awards", {
    x: 72,
    y: height - 120,
    size: 28,
    font: bold,
    color: rgb(0.12, 0.18, 0.15),
  });
  page.drawText("Certificate of Recognition", {
    x: 72,
    y: height - 160,
    size: 18,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(input.businessName, {
    x: 72,
    y: height - 260,
    size: 32,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(
    `is hereby recognized as ${placementLabel(input.placement)} in ${input.categoryName}`,
    {
      x: 72,
      y: height - 310,
      size: 16,
      font,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - 144,
    },
  );
  page.drawText(`${input.communityName} · ${input.year}`, {
    x: 72,
    y: height - 360,
    size: 14,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  page.drawText("This certificate is generated from an audited published result run.", {
    x: 72,
    y: 80,
    size: 10,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
}

function placementAccent(placement: ResultPlacement): string {
  switch (placement) {
    case "platinum":
      return "#c0c7d1";
    case "gold":
      return "#d4a84b";
    case "silver":
      return "#b8c0c8";
    case "bronze":
      return "#c47a4a";
    default:
      return "#d4a84b";
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
