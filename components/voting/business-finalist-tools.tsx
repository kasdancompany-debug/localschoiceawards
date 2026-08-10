"use client";

import { Button } from "@/components/ui/button";

type Props = {
  businessName: string;
  communityName: string;
  year: number;
  shareUrl: string;
  caption: string;
  presence: "none" | "finalist";
  squareSvgDataUrl: string;
  storySvgDataUrl: string;
  qrDataUrl: string;
};

export function BusinessFinalistTools({
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
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-sm text-muted-foreground">Finalist status</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium">
            {presence === "finalist" ? "Published finalist" : "Not a published finalist"}
          </span>
          <span className="text-sm text-muted-foreground">
            {presence === "finalist"
              ? "Free finalist badge unlocked. Vote totals are never shown here."
              : "Share tools unlock fully once finalists are published."}
          </span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
          <h2 className="font-heading text-xl font-semibold">Voting link</h2>
          <p className="break-all text-sm text-muted-foreground">{shareUrl}</p>
          <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(shareUrl)}>
            Copy voting link
          </Button>
          <div>
            <p className="mb-2 text-sm font-medium">QR code</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR code for ${businessName}`} className="h-48 w-48 rounded-xl border" />
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
          <h2 className="font-heading text-xl font-semibold">Suggested caption</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{caption}</p>
          <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(caption)}>
            Copy caption
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
          <h2 className="font-heading text-xl font-semibold">Square graphic</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={squareSvgDataUrl}
            alt={`${businessName} square finalist graphic`}
            className="w-full max-w-sm rounded-xl border"
          />
          <a
            href={squareSvgDataUrl}
            download={`${businessName.replace(/\s+/g, "-").toLowerCase()}-finalist-square.svg`}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            Download square SVG
          </a>
        </div>
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
          <h2 className="font-heading text-xl font-semibold">Story graphic</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storySvgDataUrl}
            alt={`${businessName} story finalist graphic`}
            className="w-full max-w-[220px] rounded-xl border"
          />
          <a
            href={storySvgDataUrl}
            download={`${businessName.replace(/\s+/g, "-").toLowerCase()}-finalist-story.svg`}
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
