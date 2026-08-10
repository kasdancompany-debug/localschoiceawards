import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const brand = {
  navy: "#0B1F33",
  teal: "#1F6F6A",
  sand: "#F3EDE3",
  ink: "#1A1A1A",
  muted: "#5C6670",
};

export type BrandEmailLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
  unsubscribeUrl?: string | null;
};

export function BrandEmailLayout({
  preview,
  title,
  children,
  unsubscribeUrl,
}: BrandEmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.sand, margin: 0, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Container
          style={{
            margin: "0 auto",
            maxWidth: "560px",
            padding: "32px 20px",
          }}
        >
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "4px",
              overflow: "hidden",
              border: `1px solid #e5ddd0`,
            }}
          >
            <Section style={{ backgroundColor: brand.navy, padding: "28px 28px 24px" }}>
              <Text
                style={{
                  margin: 0,
                  color: "#F7F3EC",
                  fontSize: "13px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                Locals Choice Awards
              </Text>
              <Heading
                as="h1"
                style={{
                  margin: "12px 0 0",
                  color: "#FFFFFF",
                  fontSize: "26px",
                  lineHeight: "1.25",
                  fontWeight: 600,
                }}
              >
                {title}
              </Heading>
            </Section>
            <Section style={{ padding: "28px" }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: "16px", lineHeight: "1.6" }}>
                {children}
              </Text>
            </Section>
            <Hr style={{ borderColor: "#ece4d8", margin: 0 }} />
            <Section style={{ padding: "20px 28px 28px" }}>
              <Text
                style={{
                  margin: 0,
                  color: brand.muted,
                  fontSize: "12px",
                  lineHeight: "1.5",
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                Locals Choice Awards celebrates local businesses chosen by their communities.
                {unsubscribeUrl ? (
                  <>
                    {" "}
                    <Link href={unsubscribeUrl} style={{ color: brand.teal }}>
                      Unsubscribe from promotional emails
                    </Link>
                    .
                  </>
                ) : null}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function emailParagraph(text: string) {
  return (
    <Text style={{ margin: "0 0 16px", color: brand.ink, fontSize: "16px", lineHeight: "1.6" }}>
      {text}
    </Text>
  );
}

export function emailCta(href: string, label: string) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Link
        href={href}
        style={{
          backgroundColor: brand.teal,
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "4px",
          textDecoration: "none",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        {label}
      </Link>
    </Section>
  );
}
