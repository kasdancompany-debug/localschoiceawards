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
        <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-brass uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-[0.03em] text-balance uppercase sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="font-editorial mt-5 text-lg leading-relaxed text-muted-foreground italic">
          {description}
        </p>
      ) : null}
    </header>
  );
}
