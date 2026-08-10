export type CsvParseResult = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Minimal RFC4180-style CSV parser for admin imports (no silent truncation).
 */
export function parseCsv(content: string): CsvParseResult {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0] ?? "").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

const HEADER_ALIASES: Record<string, string> = {
  legal_name: "legalName",
  legalname: "legalName",
  public_name: "publicName",
  publicname: "publicName",
  business_name: "publicName",
  name: "publicName",
  website: "websiteUrl",
  website_url: "websiteUrl",
  phone: "primaryPhone",
  primary_phone: "primaryPhone",
  email: "primaryEmail",
  primary_email: "primaryEmail",
  location: "locationName",
  location_name: "locationName",
  address: "addressLine1",
  address_line_1: "addressLine1",
  address1: "addressLine1",
  address_line_2: "addressLine2",
  address2: "addressLine2",
  region: "administrativeRegionCode",
  state: "administrativeRegionCode",
  province: "administrativeRegionCode",
  administrative_region_code: "administrativeRegionCode",
  country: "countryCode",
  country_code: "countryCode",
  postal: "postalCode",
  postal_code: "postalCode",
  zip: "postalCode",
  categories: "categorySlugs",
  category_slugs: "categorySlugs",
  service_area: "serviceAreaBusiness",
  service_area_business: "serviceAreaBusiness",
};

export function normalizeImportHeaders(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const compact = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const mapped = HEADER_ALIASES[compact] ?? key.trim();
    normalized[mapped] = value;
  }
  return normalized;
}
