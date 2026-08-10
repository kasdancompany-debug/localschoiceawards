import type {
  Business,
  BusinessAssignmentStatus,
  BusinessHours,
  BusinessLocation,
  BusinessMedia,
  BusinessMediaType,
  BusinessSocialLink,
  BusinessSocialPlatform,
  BusinessStatus,
  BusinessSubmissionRequest,
  BusinessSubmissionStatus,
} from "@/types/business";

export type BusinessRow = {
  id: string;
  legal_name: string;
  public_name: string;
  slug: string;
  description: string;
  website_url: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  logo_url: string | null;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BusinessLocationRow = {
  id: string;
  business_id: string;
  community_id: string;
  location_name: string;
  slug: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  administrative_region_code: string | null;
  country_code: "CA" | "US" | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  service_area_business: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    legalName: row.legal_name,
    publicName: row.public_name,
    slug: row.slug,
    description: row.description,
    websiteUrl: row.website_url,
    primaryPhone: row.primary_phone,
    primaryEmail: row.primary_email,
    logoUrl: row.logo_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function mapBusinessLocation(row: BusinessLocationRow): BusinessLocation {
  return {
    id: row.id,
    businessId: row.business_id,
    communityId: row.community_id,
    locationName: row.location_name,
    slug: row.slug,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    administrativeRegionCode: row.administrative_region_code,
    countryCode: row.country_code,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    websiteUrl: row.website_url,
    serviceAreaBusiness: row.service_area_business,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function mapBusinessHours(row: {
  id: string;
  business_location_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  closed: boolean;
  appointment_only: boolean;
}): BusinessHours {
  return {
    id: row.id,
    businessLocationId: row.business_location_id,
    dayOfWeek: row.day_of_week,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    closed: row.closed,
    appointmentOnly: row.appointment_only,
  };
}

export function mapBusinessSocialLink(row: {
  id: string;
  business_id: string;
  platform: BusinessSocialPlatform;
  url: string;
}): BusinessSocialLink {
  return {
    id: row.id,
    businessId: row.business_id,
    platform: row.platform,
    url: row.url,
  };
}

export function mapBusinessMedia(row: {
  id: string;
  business_id: string;
  business_location_id: string | null;
  media_type: BusinessMediaType;
  storage_path: string;
  alt_text: string;
  display_order: number;
  approved: boolean;
  created_at: string;
}): BusinessMedia {
  return {
    id: row.id,
    businessId: row.business_id,
    businessLocationId: row.business_location_id,
    mediaType: row.media_type,
    storagePath: row.storage_path,
    altText: row.alt_text,
    displayOrder: row.display_order,
    approved: row.approved,
    createdAt: row.created_at,
  };
}

export function mapBusinessSubmission(row: {
  id: string;
  campaign_id: string;
  submitted_by_user_id: string | null;
  business_name: string;
  category_id: string | null;
  address: string | null;
  website_url: string | null;
  phone: string | null;
  submitter_email: string;
  status: BusinessSubmissionStatus;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}): BusinessSubmissionRequest {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    submittedByUserId: row.submitted_by_user_id,
    businessName: row.business_name,
    categoryId: row.category_id,
    address: row.address,
    websiteUrl: row.website_url,
    phone: row.phone,
    submitterEmail: row.submitter_email,
    status: row.status,
    reviewerNotes: row.reviewer_notes,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export type { BusinessAssignmentStatus };
