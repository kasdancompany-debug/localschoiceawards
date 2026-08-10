import type { Metadata } from "next";

import { ContactForm } from "@/components/forms/public-forms";
import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Locals Choice Awards team.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <PageIntro
          eyebrow="Contact"
          title="We’re here to help"
          description="Questions about a community season, partnership, or launch request? Send a note and we’ll get back to you."
        />
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </PageShell>
  );
}
