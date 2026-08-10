"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildLoginPath } from "@/lib/auth/redirects";
import {
  getAuthenticatedSession,
  requireAdminSession,
  requireUser,
} from "@/lib/auth/session";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import {
  createMissingBusinessNomination,
  createNomination,
  exportNominationsCsv,
  invalidateNomination,
  recordFraudSignal,
  reviewFraudSignal,
} from "@/lib/nominations/service";
import { hashIpFingerprint } from "@/lib/nominations/privacy";
import { toRoute } from "@/lib/routes";
import { assertAppRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  createNominationSchema,
  invalidateNominationSchema,
  reviewFraudSignalSchema,
  suggestMissingBusinessNominationSchema,
} from "@/lib/validation/nominations";

export type NominationActionState = {
  ok: boolean;
  message?: string;
  nominationId?: string;
  status?: string;
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

export async function createNominationAction(
  _prev: NominationActionState,
  formData: FormData,
): Promise<NominationActionState> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { ok: false, message: "Community not found." };
  }

  const session = await getAuthenticatedSession();
  if (!session) {
    redirect(toRoute(buildLoginPath("/nominate")));
  }
  if (!session.emailConfirmed) {
    return { ok: false, message: "Verify your email before nominating." };
  }

  const parsed = createNominationSchema.safeParse({
    campaignCategoryId: formData.get("campaignCategoryId"),
    businessLocationId: formData.get("businessLocationId"),
    turnstileToken: formData.get("turnstileToken"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }
  if (!parsed.data.businessLocationId) {
    return { ok: false, message: "Choose a business to nominate." };
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
    action: "nominate",
    identifier: session.userId,
    ipAddress: ip,
  });
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many nominations. Try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  if (!campaign) {
    return { ok: false, message: "No published campaign is available." };
  }

  const result = await createNomination({
    campaign,
    communityId: community.id,
    userId: session.userId,
    email: session.email,
    emailConfirmed: session.emailConfirmed,
    campaignCategoryId: parsed.data.campaignCategoryId,
    businessLocationId: parsed.data.businessLocationId,
    ipAddress: ip,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  redirect(toRoute(`/nominate/success?id=${result.nominationId}`));
}

export async function suggestMissingBusinessNominationAction(
  _prev: NominationActionState,
  formData: FormData,
): Promise<NominationActionState> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { ok: false, message: "Community not found." };
  }

  const session = await getAuthenticatedSession();
  if (!session) {
    redirect(toRoute(buildLoginPath("/nominate")));
  }
  if (!session.emailConfirmed) {
    return { ok: false, message: "Verify your email before nominating." };
  }

  const parsed = suggestMissingBusinessNominationSchema.safeParse({
    campaignCategoryId: formData.get("campaignCategoryId"),
    businessName: formData.get("businessName"),
    address: formData.get("address") || "",
    websiteUrl: formData.get("websiteUrl") || "",
    phone: formData.get("phone") || "",
    turnstileToken: formData.get("turnstileToken"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const ip = await getRequestIp();
  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const rate = await assertAppRateLimit({
    action: "nominate_suggest",
    identifier: session.userId,
    ipAddress: ip,
  });
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many suggestions. Try again in ${rate.retryAfterSeconds} seconds.`,
    };
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  if (!campaign) {
    return { ok: false, message: "No published campaign is available." };
  }

  const result = await createMissingBusinessNomination({
    campaign,
    communityId: community.id,
    userId: session.userId,
    email: session.email,
    emailConfirmed: session.emailConfirmed,
    campaignCategoryId: parsed.data.campaignCategoryId,
    businessName: parsed.data.businessName,
    address: parsed.data.address || null,
    websiteUrl: parsed.data.websiteUrl || null,
    phone: parsed.data.phone || null,
    ipAddress: ip,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  redirect(toRoute(`/nominate/success?id=${result.nominationId}&pending=1`));
}

export async function invalidateNominationAction(
  _prev: NominationActionState,
  formData: FormData,
): Promise<NominationActionState> {
  const session = await requireAdminSession("/admin/nominations");
  const parsed = invalidateNominationSchema.safeParse({
    nominationId: formData.get("nominationId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await invalidateNomination({
    nominationId: parsed.data.nominationId,
    actorUserId: session.userId,
    reason: parsed.data.reason,
  });
  return result;
}

export async function reviewFraudSignalAction(
  _prev: NominationActionState,
  formData: FormData,
): Promise<NominationActionState> {
  const session = await requireAdminSession("/admin/nominations");
  const parsed = reviewFraudSignalSchema.safeParse({
    signalId: formData.get("signalId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await reviewFraudSignal({
    signalId: parsed.data.signalId,
    status: parsed.data.status,
    reviewerUserId: session.userId,
  });
  return { ok: result.ok, message: result.ok ? "Signal updated." : "Unable to update signal." };
}

export async function exportNominationsAction(campaignId: string): Promise<{ csv: string }> {
  await requireAdminSession("/admin/nominations");
  const csv = await exportNominationsCsv(campaignId);
  return { csv };
}

export async function requireVerifiedNominator(nextPath: string) {
  const session = await requireUser({ next: nextPath });
  if (!session.emailConfirmed) {
    return { ...session, blocked: true as const };
  }
  return { ...session, blocked: false as const };
}
