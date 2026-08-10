"use server";

import { requireAdminSession } from "@/lib/auth/session";
import { mapCampaign } from "@/lib/campaigns/mappers";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import {
  approveResultRun,
  publishResultRun,
  revokeAwardEligibility,
  startAndComputeResultRun,
} from "@/lib/results/service";
import {
  approveResultRunSchema,
  publishResultRunSchema,
  revokeEligibilitySchema,
  startResultRunSchema,
} from "@/lib/validation/results";

export type ResultsActionState = {
  ok: boolean;
  message?: string;
};

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

async function loadCampaign(campaignId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
  return data ? mapCampaign(data) : null;
}

export async function startResultRunAction(
  _prev: ResultsActionState,
  formData: FormData,
): Promise<ResultsActionState> {
  const session = await requireAdminSession("/admin/results");
  const parsed = startResultRunSchema.safeParse({
    campaignId: formData.get("campaignId"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const campaign = await loadCampaign(parsed.data.campaignId);
  if (!campaign) {
    return { ok: false, message: "Campaign not found." };
  }

  return startAndComputeResultRun({
    campaign,
    actorUserId: session.userId,
  });
}

export async function approveResultRunAction(
  _prev: ResultsActionState,
  formData: FormData,
): Promise<ResultsActionState> {
  const session = await requireAdminSession("/admin/results");
  const parsed = approveResultRunSchema.safeParse({
    resultRunId: formData.get("resultRunId"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  return approveResultRun({
    resultRunId: parsed.data.resultRunId,
    actorUserId: session.userId,
  });
}

export async function publishResultRunAction(
  _prev: ResultsActionState,
  formData: FormData,
): Promise<ResultsActionState> {
  const session = await requireAdminSession("/admin/results");
  const parsed = publishResultRunSchema.safeParse({
    resultRunId: formData.get("resultRunId"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { data: run } = await supabase
    .from("result_runs")
    .select("campaign_id")
    .eq("id", parsed.data.resultRunId)
    .maybeSingle();
  if (!run) {
    return { ok: false, message: "Result run not found." };
  }

  const campaign = await loadCampaign(run.campaign_id);
  if (!campaign) {
    return { ok: false, message: "Campaign not found." };
  }

  const { data: community } = await supabase
    .from("communities")
    .select("name, subdomain")
    .eq("id", campaign.communityId)
    .maybeSingle();

  if (!community) {
    return { ok: false, message: "Community not found." };
  }

  return publishResultRun({
    resultRunId: parsed.data.resultRunId,
    actorUserId: session.userId,
    campaign,
    communityName: community.name,
    communitySubdomain: community.subdomain,
  });
}

export async function revokeEligibilityAction(
  _prev: ResultsActionState,
  formData: FormData,
): Promise<ResultsActionState> {
  const session = await requireAdminSession("/admin/results");
  const parsed = revokeEligibilitySchema.safeParse({
    eligibilityId: formData.get("eligibilityId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  return revokeAwardEligibility({
    eligibilityId: parsed.data.eligibilityId,
    actorUserId: session.userId,
    reason: parsed.data.reason,
  });
}
