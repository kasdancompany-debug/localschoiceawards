export const ANALYTICS_EVENTS = {
  communitySearch: "community_search",
  communitySearchZeroResults: "community_search_zero_results",
  communitySearchClick: "community_search_click",
  communityRequestSubmitted: "community_request_submitted",
  contactSubmitted: "contact_submitted",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
