import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PageShell({ children, className, narrow = false }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-12 sm:px-6 sm:py-16",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
