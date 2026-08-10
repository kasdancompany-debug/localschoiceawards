export {
  assertOrderPaidForFulfillment,
  buildSubmissionIdempotencyKey,
  canAccessSupplierFulfillment,
  canSubmitFulfillment,
  calculateGrossMargin,
  destinationCountryFromAddress,
  selectSupplierForOrder,
  rankSupplierCandidates,
} from "@/lib/fulfillment/rules";
export {
  createFulfillmentsForPaidOrder,
  getFulfillmentDetail,
  listFulfillmentsForAdmin,
  listFulfillmentsForSupplier,
  buildMarginReports,
  getSupplierPerformance,
  getSupplierIdsForUser,
} from "@/lib/fulfillment/service";
