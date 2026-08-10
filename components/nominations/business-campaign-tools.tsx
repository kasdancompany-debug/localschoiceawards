"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  businessName: string;
  communityName: string;
  year: number;
  shareUrl: string;
  caption: string;
  presence: "none" | "nominated";
  squareSvgDataUrl: string;
  storySvgDataUrl: string;
  qrDataUrl: string;
};

export function BusinessCampaignTools({
  businessName,
  communityName,
  year,
  shareUrl,
  caption,
  presence,
  squareSvgDataUrl,
  storySvgDataUrl,
  qrDataUrl,
}: Props) {
  const badgeLabel = useMemo(
    () => (presence === "nominated" ? "Nominee" : "Not yet nominated"),
    [presence],
  );

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-sm text-muted-foreground">Nomination status</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium">
            {badgeLabel}
          </span>
          {presence === "nominated" ? (
            <span className="text-sm text-muted-foreground">
              Free nominee badge unlocked. Exact totals are never shown.
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Share your link so customers can nominate you during the open phase.
            </span>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Share link</h2>
          <p className="break-all text-sm text-muted-foreground">{shareUrl}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy share link
          </Button>
          <div>
            <p className="mb-2 text-sm font-medium">QR code</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR code for ${businessName}`} className="h-48 w-48 rounded-xl border" />
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Suggested caption</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{caption}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(caption)}
          >
            Copy caption
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Square social graphic</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={squareSvgDataUrl}
            alt={`${businessName} square nominee graphic`}
            className="w-full max-w-sm rounded-xl border"
          />
          <a
            href={squareSvgDataUrl}
            download={`${businessName.replace(/\s+/g, "-").toLowerCase()}-square.svg`}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            Download square SVG
          </a>
        </div>
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold">Story graphic</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storySvgDataUrl}
            alt={`${businessName} story nominee graphic`}
            className="w-full max-w-[220px] rounded-xl border"
          />
          <a
            href={storySvgDataUrl}
            download={`${businessName.replace(/\s+/g, "-").toLowerCase()}-story.svg`}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            Download story SVG
          </a>
          <p className="text-xs text-muted-foreground">
            {communityName} Locals Choice {year}
          </p>
        </div>
      </section>
    </div>
  );
}
