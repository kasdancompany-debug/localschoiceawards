export const BUSINESS_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const BUSINESS_ASSIGNMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export type BusinessAssignmentStatus = (typeof BUSINESS_ASSIGNMENT_STATUSES)[number];

export const BUSINESS_SUBMISSION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_info",
] as const;

export type BusinessSubmissionStatus = (typeof BUSINESS_SUBMISSION_STATUSES)[number];

export const BUSINESS_SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "linkedin",
  "other",
] as const;

export type BusinessSocialPlatform = (typeof BUSINESS_SOCIAL_PLATFORMS)[number];

export const BUSINESS_MEDIA_TYPES = ["logo", "photo", "cover"] as const;
export type BusinessMediaType = (typeof BUSINESS_MEDIA_TYPES)[number];

export const IMPORT_ROW_RESOLUTIONS = ["pending", "import", "skip", "merge_manual"] as const;
export type ImportRowResolution = (typeof IMPORT_ROW_RESOLUTIONS)[number];

export type Business = {
  id: string;
  legalName: string;
  publicName: string;
  slug: string;
  description: string;
  websiteUrl: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  logoUrl: string | null;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BusinessLocation = {
  id: string;
  businessId: string;
  communityId: string;
  locationName: string;
  slug: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  administrativeRegionCode: string | null;
  countryCode: "CA" | "US" | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  serviceAreaBusiness: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BusinessHours = {
  id: string;
  businessLocationId: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
  appointmentOnly: boolean;
};

export type BusinessSocialLink = {
  id: string;
  businessId: string;
  platform: BusinessSocialPlatform;
  url: string;
};

export type BusinessMedia = {
  id: string;
  businessId: string;
  businessLocationId: string | null;
  mediaType: BusinessMediaType;
  storagePath: string;
  altText: string;
  displayOrder: number;
  approved: boolean;
  createdAt: string;
};

export type BusinessCategoryAssignment = {
  id: string;
  businessLocationId: string;
  campaignCategoryId: string;
  status: BusinessAssignmentStatus;
  assignedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessSubmissionRequest = {
  id: string;
  campaignId: string;
  submittedByUserId: string | null;
  businessName: string;
  categoryId: string | null;
  address: string | null;
  websiteUrl: string | null;
  phone: string | null;
  submitterEmail: string;
  status: BusinessSubmissionStatus;
  reviewerNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type PublicBusinessListing = {
  business: Business;
  location: BusinessLocation;
  categories: Array<{ id: string; name: string; slug: string; groupName: string }>;
};

export type PublicBusinessProfile = {
  business: Business;
  locations: BusinessLocation[];
  hoursByLocationId: Record<string, BusinessHours[]>;
  socialLinks: BusinessSocialLink[];
  media: BusinessMedia[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    groupName: string;
    locationId: string;
  }>;
};

export type DuplicateCandidate = {
  businessId: string;
  locationId?: string;
  publicName: string;
  slug: string;
  communityId?: string;
  reasons: string[];
  score: number;
};

export type BusinessImportRowInput = {
  legalName: string;
  publicName: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  locationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  administrativeRegionCode?: string;
  countryCode?: "CA" | "US";
  postalCode?: string;
  phone?: string;
  email?: string;
  websiteLocationUrl?: string;
  serviceAreaBusiness?: boolean;
  categorySlugs?: string[];
};
