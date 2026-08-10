"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildLoginPath } from "@/lib/auth/redirects";
import {
  getAuthenticatedSession,
  requireAdminSession,
} from "@/lib/auth/session";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { hashIpFingerprint } from "@/lib/nominations/privacy";
import { recordFraudSignal } from "@/lib/nominations/service";
import { toRoute } from "@/lib/routes";
import { assertAppRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  castVoteSchema,
  generateFinalistsSchema,
  invalidateVoteSchema,
  lockVotingSchema,
  manualAddFinalistSchema,
  publishFinalistsSchema,
  reviewFinalistSchema,
} from "@/lib/validation/voting";
import {
  approveFinalist,
  castOrChangeVote,
  generateProposedFinalists,
  invalidateVote,
  lockVoting,
  manualAddFinalist,
  publishFinalists,
  removeFinalist,
} from "@/lib/voting/service";

export type VotingActionState = {
  ok: boolean;
  message?: string;
};

async function getRequestIp(): Promise<string | undefined> {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    undefined
  );
}

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function castVoteAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { ok: false, message: "Community not found." };
  }

  const session = await getAuthenticatedSession();
  if (!session) {
    redirect(toRoute(buildLoginPath("/vote")));
  }
  if (!session.emailConfirmed) {
    return { ok: false, message: "Verify your email before voting." };
  }

  const parsed = castVoteSchema.safeParse({
    campaignCategoryId: formData.get("campaignCategoryId"),
    finalistId: formData.get("finalistId"),
    turnstileToken: formData.get("turnstileToken"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const ip = await getRequestIp();
  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    const campaign = await getPublicCampaignForCommunity(community.id);
    if (campaign) {
      await recordFraudSignal({
        campaignId: campaign.id,
        entityType: "user",
        entityId: session.userId,
        signalType: "turnstile_failure",
        riskScore: 50,
        metadata: { ipHash: ip ? hashIpFingerprint(ip) : null },
      });
    }
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const rate = await assertAppRateLimit({
    action: "vote",
    identifier: session.userId,
    ipAddress: ip,
  });
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many vote attempts. Try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  if (!campaign) {
    return { ok: false, message: "No published campaign is available." };
  }

  const result = await castOrChangeVote({
    campaign,
    communityId: community.id,
    userId: session.userId,
    email: session.email,
    emailConfirmed: session.emailConfirmed,
    campaignCategoryId: parsed.data.campaignCategoryId,
    finalistId: parsed.data.finalistId,
    ipAddress: ip,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  const categorySlug = String(formData.get("categorySlug") ?? "");
  const qs = new URLSearchParams({
    id: result.voteId,
    ...(result.changed ? { changed: "1" } : {}),
    ...(categorySlug ? { category: categorySlug } : {}),
  });
  redirect(toRoute(`/vote/success?${qs.toString()}`));
}

export async function generateFinalistsAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  const session = await requireAdminSession("/admin/voting");
  const parsed = generateFinalistsSchema.safeParse({
    campaignId: formData.get("campaignId"),
    campaignCategoryId: formData.get("campaignCategoryId") || "",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await generateProposedFinalists({
    campaignId: parsed.data.campaignId,
    campaignCategoryId: parsed.data.campaignCategoryId || null,
    actorUserId: session.userId,
  });
  return { ok: result.ok, message: result.message };
}

export async function reviewFinalistAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  const session = await requireAdminSession("/admin/voting");
  const parsed = reviewFinalistSchema.safeParse({
    finalistId: formData.get("finalistId"),
    action: formData.get("action"),
    reason: formData.get("reason") || "",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  if (parsed.data.action === "approve") {
    return approveFinalist({
      finalistId: parsed.data.finalistId,
      actorUserId: session.userId,
    });
  }
  if (parsed.data.action === "remove") {
    if (!parsed.data.reason || parsed.data.reason.trim().length < 3) {
      return { ok: false, message: "A removal reason is required." };
    }
    return removeFinalist({
      finalistId: parsed.data.finalistId,
      actorUserId: session.userId,
      reason: parsed.data.reason,
    });
  }

  // publish single via publish all approved path is campaign-level; treat as approve+note
  return approveFinalist({
    finalistId: parsed.data.finalistId,
    actorUserId: session.userId,
  });
}

export async function publishFinalistsAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  const session = await requireAdminSession("/admin/voting");
  const parsed = publishFinalistsSchema.safeParse({
    campaignId: formData.get("campaignId"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await publishFinalists({
    campaignId: parsed.data.campaignId,
    actorUserId: session.userId,
  });
  return { ok: result.ok, message: result.message };
}

export async function manualAddFinalistAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  const session = await requireAdminSession("/admin/voting");
  const parsed = manualAddFinalistSchema.safeParse({
    campaignId: formData.get("campaignId"),
    campaignCategoryId: formData.get("campaignCategoryId"),
    businessLocationId: formData.get("businessLocationId"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  return manualAddFinalist({
    ...parsed.data,
    actorUserId: session.userId,
  });
}

export async function invalidateVoteAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  const session = await requireAdminSession("/admin/voting");
  const parsed = invalidateVoteSchema.safeParse({
    voteId: formData.get("voteId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  return invalidateVote({
    voteId: parsed.data.voteId,
    actorUserId: session.userId,
    reason: parsed.data.reason,
  });
}

export async function lockVotingAction(
  _prev: VotingActionState,
  formData: FormData,
): Promise<VotingActionState> {
  await requireAdminSession("/admin/voting");
  const parsed = lockVotingSchema.safeParse({
    campaignId: formData.get("campaignId"),
    lock: formData.get("lock"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  return lockVoting({
    campaignId: parsed.data.campaignId,
    lock: parsed.data.lock === "true",
  });
}
