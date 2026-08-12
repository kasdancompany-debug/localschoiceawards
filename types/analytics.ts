export type AnalyticsEventRecord = {
  id: string;
  eventName: string;
  communityId: string | null;
  campaignId: string | null;
  businessId: string | null;
  userId: string | null;
  anonymousId: string | null;
  properties: Record<string, unknown>;
  occurredAt: string;
};

export type BusinessProfileDailyMetric = {
  id: string;
  businessId: string;
  businessLocationId: string | null;
  date: string;
  profileViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionClicks: number;
  nominationLinkClicks: number;
  votingLinkClicks: number;
  assetDownloads: number;
};

export type CommunityDailyMetric = {
  id: string;
  communityId: string;
  campaignId: string | null;
  date: string;
  visitors: number;
  registeredUsers: number;
  nominations: number;
  voters: number;
  votes: number;
  claimedBusinesses: number;
  orders: number;
  revenueCents: number;
};
