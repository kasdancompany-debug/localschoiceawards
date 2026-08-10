"use client";

import { useActionState, useCallback, useMemo, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { castVoteAction, type VotingActionState } from "@/lib/voting/actions";
import type { PublicFinalistView } from "@/types/voting";

const initialState: VotingActionState = { ok: false };

type Props = {
  campaignCategoryId: string;
  categorySlug: string;
  categoryName: string;
  finalists: PublicFinalistView[];
  selectedFinalistId: string | null;
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  loginHref: string;
  progress: { completed: number; total: number };
};

export function VoteBallotPanel({
  campaignCategoryId,
  categorySlug,
  categoryName,
  finalists,
  selectedFinalistId,
  isAuthenticated,
  emailConfirmed,
  loginHref,
  progress,
}: Props) {
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState(selectedFinalistId ?? "");
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(castVoteAction, initialState);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return finalists;
    return finalists.filter((finalist) =>
      `${finalist.businessName} ${finalist.locationName}`.toLowerCase().includes(needle),
    );
  }, [finalists, query]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Sign in with a verified account to vote in {categoryName}.
        </p>
        <a
          href={loginHref}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign in to vote
        </a>
      </div>
    );
  }

  if (!emailConfirmed) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Verify your email address before voting. Check your inbox for the confirmation link.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
        Progress: {progress.completed} of {progress.total} categories completed
        {selectedFinalistId ? " · You can change your choice until voting closes." : ""}
      </div>

      <form action={action} className="space-y-5">
        <input type="hidden" name="campaignCategoryId" value={campaignCategoryId} />
        <input type="hidden" name="finalistId" value={choice} />
        <input type="hidden" name="categorySlug" value={categorySlug} />
        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <AuthFormMessage tone="error" message={state.message} />

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search finalists"
          className="h-12"
          aria-label="Search finalists"
        />

        <ul className="space-y-3">
          {filtered.map((finalist) => {
            const selected = choice === finalist.id;
            return (
              <li key={finalist.id}>
                <button
                  type="button"
                  onClick={() => setChoice(finalist.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-foreground bg-muted/60 ring-2 ring-foreground/20"
                      : "border-border/70 hover:border-foreground/30"
                  }`}
                  aria-pressed={selected}
                >
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                    {finalist.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={finalist.logoUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        {finalist.businessName.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{finalist.businessName}</span>
                    <span className="block text-sm text-muted-foreground">
                      {finalist.locationName}
                    </span>
                  </span>
                  {selected ? (
                    <span className="text-xs font-semibold tracking-wide uppercase">Selected</span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {!filtered.length ? (
            <li className="text-sm text-muted-foreground">No finalists match that search.</li>
          ) : null}
        </ul>

        <TurnstileField onTokenChange={onTokenChange} />
        <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending || !choice || !turnstileToken}>
          {pending
            ? "Saving…"
            : selectedFinalistId
              ? "Update my vote"
              : "Cast my vote"}
        </Button>
      </form>
    </div>
  );
}
