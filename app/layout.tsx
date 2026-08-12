import type { Metadata } from "next";
import { Big_Shoulders, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-editorial-family",
  subsets: ["latin"],
  display: "swap",
});

const bigShoulders = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_APP_URL
      : "https://localschoiceawards.com",
  ),
  title: {
    default: "Locals Choice Awards",
    template: "%s · Locals Choice Awards",
  },
  description:
    "Celebrating the businesses communities love — community voting and recognition across Canada and the United States.",
  openGraph: {
    type: "website",
    siteName: "Locals Choice Awards",
    title: "Locals Choice Awards",
    description:
      "Celebrating the businesses communities love — community voting and recognition across Canada and the United States.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Locals Choice Awards",
    description:
      "Celebrating the businesses communities love — community voting and recognition across Canada and the United States.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable} ${bigShoulders.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
