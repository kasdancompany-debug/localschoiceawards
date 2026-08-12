import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BusinessEngagementTracker } from "@/components/analytics/business-engagement-tracker";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getPublicBusinessBySlug, getSignedBusinessMediaUrl } from "@/lib/businesses";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { env } from "@/lib/env/server";
import { placementLabel } from "@/lib/results/rules";
import { listPublicBusinessWins } from "@/lib/results/service";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type BusinessPageProps = {
  params: Promise<{ businessSlug: string }>;
};

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { businessSlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Business" };
  }
  const profile = await getPublicBusinessBySlug(businessSlug, community.id);
  return buildCommunityMetadata(community, {
    title: profile
      ? `${profile.business.publicName} · ${community.name}`
      : `Business · ${community.name}`,
    description: profile?.business.description || `Business profile in ${community.name}.`,
    pathname: `/business/${businessSlug}`,
  });
}

export default async function BusinessProfilePage({ params }: BusinessPageProps) {
  const { businessSlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const profile = await getPublicBusinessBySlug(businessSlug, community.id);
  if (!profile) {
    notFound();
  }

  const { business, locations, hoursByLocationId, socialLinks, categories } = profile;
  const primaryLocation = locations[0];
  const logoUrl = business.logoUrl
    ? await getSignedBusinessMediaUrl(business.logoUrl)
    : null;
  const wins = await listPublicBusinessWins({
    businessId: business.id,
    communityId: community.id,
  });
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = root.includes("localhost") ? "http" : "https";
  const claimUrl = `${protocol}://business.${root}/claims/new?businessId=${encodeURIComponent(business.id)}`;

  return (
    <PageShell>
      <BusinessEngagementTracker
        businessId={business.id}
        communityId={community.id}
        businessLocationId={primaryLocation?.id ?? null}
      />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <PageIntro
            eyebrow={community.name}
            title={business.publicName}
            description={business.description || undefined}
          />

          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${business.publicName} logo`}
              width={96}
              height={96}
              unoptimized
              className="mt-8 h-24 w-24 rounded-2xl border border-border object-cover"
            />
          ) : null}

          <dl className="mt-10 space-y-4 text-sm">
            {business.websiteUrl ? (
              <div>
                <dt className="font-medium text-muted-foreground">Website</dt>
                <dd className="mt-1">
                  <a
                    href={business.websiteUrl}
                    data-analytics="website"
                    className="text-primary underline-offset-4 hover:underline"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {business.websiteUrl}
                  </a>
                </dd>
              </div>
            ) : null}
            {business.primaryPhone || primaryLocation?.phone ? (
              <div>
                <dt className="font-medium text-muted-foreground">Phone</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${business.primaryPhone || primaryLocation?.phone}`}
                    data-analytics="phone"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {business.primaryPhone || primaryLocation?.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {primaryLocation ? (
              <div>
                <dt className="font-medium text-muted-foreground">
                  {primaryLocation.serviceAreaBusiness ? "Service area" : "Address"}
                </dt>
                <dd className="mt-1">
                  {primaryLocation.serviceAreaBusiness
                    ? `Serves ${community.name}`
                    : [
                        primaryLocation.addressLine1,
                        primaryLocation.addressLine2,
                        [primaryLocation.city, primaryLocation.administrativeRegionCode]
                          .filter(Boolean)
                          .join(", "),
                        primaryLocation.postalCode,
                      ]
                        .filter(Boolean)
                        .join(" · ") || primaryLocation.locationName}
                  {!primaryLocation.serviceAreaBusiness &&
                  primaryLocation.addressLine1 ? (
                    <>
                      {" · "}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [
                            primaryLocation.addressLine1,
                            primaryLocation.city,
                            primaryLocation.administrativeRegionCode,
                            primaryLocation.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", "),
                        )}`}
                        data-analytics="directions"
                        className="text-primary underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Directions
                      </a>
                    </>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Hours</h2>
            {primaryLocation && (hoursByLocationId[primaryLocation.id] ?? []).length ? (
              <ul className="mt-4 space-y-2">
                {(hoursByLocationId[primaryLocation.id] ?? [])
                  .slice()
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-sm"
                    >
                      <span>{DAY_LABELS[entry.dayOfWeek] ?? `Day ${entry.dayOfWeek}`}</span>
                      <span className="text-muted-foreground">
                        {entry.closed
                          ? "Closed"
                          : entry.appointmentOnly
                            ? "By appointment"
                            : `${entry.opensAt ?? "—"} – ${entry.closesAt ?? "—"}`}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Hours not published yet.</p>
            )}
          </section>

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Categories</h2>
            {categories.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={`${category.id}-${category.locationId}`}>
                    <Link
                      href={toRoute(`/category/${category.slug}`)}
                      className="inline-flex rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No categories assigned yet.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Social</h2>
            {socialLinks.length ? (
              <ul className="mt-4 space-y-2">
                {socialLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      className="text-sm text-primary underline-offset-4 hover:underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No social links yet.</p>
            )}
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Award history</h2>
            {wins.length ? (
              <ul className="mt-4 space-y-3">
                {wins.map((win) => (
                  <li key={win.resultId} className="text-sm">
                    <p className="font-medium">
                      {placementLabel(win.placement)} · {win.categoryName}
                    </p>
                    <p className="text-muted-foreground">{win.campaignYear}</p>
                    <Link
                      href={toRoute(`/winners/${win.campaignYear}`)}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      View {win.campaignYear} winners
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-4 border-0 bg-transparent px-0 py-6"
                title="No published wins yet"
                description="Award history appears here after audited results are published."
              />
            )}
            <Link
              href={toRoute(`/order/${business.slug}`)}
              className={cn(buttonVariants({ size: "lg" }), "mt-5 inline-flex h-12 w-full px-5")}
            >
              Order awards or promote
            </Link>
          </div>

          <div className="rounded-3xl border border-border/80 bg-muted/40 p-6">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Own this business?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Claim this listing through the business portal. Domain email helps review but never
              auto-approves. To buy trophies or promote without claiming, use Order awards.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={toRoute(`/order/${business.slug}`)}
                className={cn(buttonVariants({ size: "lg" }), "inline-flex h-12 px-5")}
              >
                Order without login
              </Link>
              <a
                href={claimUrl}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "inline-flex h-12 px-5")}
              >
                Claim this business
              </a>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
