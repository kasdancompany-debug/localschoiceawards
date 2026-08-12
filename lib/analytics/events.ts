export const ANALYTICS_EVENTS = {
  communitySearch: "community_search",
  communitySearchZeroResults: "community_search_zero_results",
  communitySearchClick: "community_search_click",
  communityRequestSubmitted: "community_request_submitted",
  contactSubmitted: "contact_submitted",
  businessProfileView: "business.profile_view",
  businessWebsiteClick: "business.website_click",
  businessPhoneClick: "business.phone_click",
  businessDirectionClick: "business.direction_click",
  businessNominationLinkClick: "business.nomination_link_click",
  businessVotingLinkClick: "business.voting_link_click",
  businessAssetDownload: "business.asset_download",
  nominationPageView: "nomination.page_view",
  votingPageView: "voting.page_view",
  funnelSignup: "funnel.signup",
  funnelNominate: "funnel.nominate",
  funnelVote: "funnel.vote",
  funnelWinnerView: "funnel.winner_view",
  funnelProductView: "funnel.product_view",
  funnelAddToCart: "funnel.add_to_cart",
  funnelCheckoutStarted: "funnel.checkout_started",
  funnelOrderPaid: "funnel.order_paid",
  winnerProductView: "winner.product_view",
  winnerProductPurchase: "winner.product_purchase",
  emailDelivered: "email.delivered",
  emailOpened: "email.opened",
  emailClicked: "email.clicked",
  campaignCompleted: "campaign.completed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Events the public browser tracker may emit (server-only events are excluded). */
export const CLIENT_TRACKABLE_ANALYTICS_EVENTS = [
  ANALYTICS_EVENTS.communitySearch,
  ANALYTICS_EVENTS.communitySearchZeroResults,
  ANALYTICS_EVENTS.communitySearchClick,
  ANALYTICS_EVENTS.communityRequestSubmitted,
  ANALYTICS_EVENTS.contactSubmitted,
  ANALYTICS_EVENTS.businessProfileView,
  ANALYTICS_EVENTS.businessWebsiteClick,
  ANALYTICS_EVENTS.businessPhoneClick,
  ANALYTICS_EVENTS.businessDirectionClick,
  ANALYTICS_EVENTS.businessNominationLinkClick,
  ANALYTICS_EVENTS.businessVotingLinkClick,
  ANALYTICS_EVENTS.businessAssetDownload,
  ANALYTICS_EVENTS.nominationPageView,
  ANALYTICS_EVENTS.votingPageView,
  ANALYTICS_EVENTS.funnelSignup,
  ANALYTICS_EVENTS.funnelNominate,
  ANALYTICS_EVENTS.funnelVote,
  ANALYTICS_EVENTS.funnelWinnerView,
  ANALYTICS_EVENTS.funnelProductView,
  ANALYTICS_EVENTS.funnelAddToCart,
  ANALYTICS_EVENTS.funnelCheckoutStarted,
  ANALYTICS_EVENTS.winnerProductView,
] as const;

export type ClientTrackableAnalyticsEvent =
  (typeof CLIENT_TRACKABLE_ANALYTICS_EVENTS)[number];

export type BusinessMetricColumn =
  | "profile_views"
  | "website_clicks"
  | "phone_clicks"
  | "direction_clicks"
  | "nomination_link_clicks"
  | "voting_link_clicks"
  | "asset_downloads";

export const EVENT_TO_BUSINESS_METRIC: Partial<
  Record<(typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS], BusinessMetricColumn>
> = {
  [ANALYTICS_EVENTS.businessProfileView]: "profile_views",
  [ANALYTICS_EVENTS.businessWebsiteClick]: "website_clicks",
  [ANALYTICS_EVENTS.businessPhoneClick]: "phone_clicks",
  [ANALYTICS_EVENTS.businessDirectionClick]: "direction_clicks",
  [ANALYTICS_EVENTS.businessNominationLinkClick]: "nomination_link_clicks",
  [ANALYTICS_EVENTS.businessVotingLinkClick]: "voting_link_clicks",
  [ANALYTICS_EVENTS.businessAssetDownload]: "asset_downloads",
  [ANALYTICS_EVENTS.nominationPageView]: "nomination_link_clicks",
  [ANALYTICS_EVENTS.votingPageView]: "voting_link_clicks",
};

/** Properties that must never appear in business-facing analytics. */
export const FORBIDDEN_ANALYTICS_PROPERTY_KEYS = [
  "vote_choice",
  "voteChoice",
  "ballot",
  "selected_finalist_id",
  "selectedFinalistId",
  "voter_id",
  "voterId",
  "nominee_user_id",
  "individual_vote",
  "individualVote",
] as const;
